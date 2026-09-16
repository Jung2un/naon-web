/**
 * Gemini 이미지 생성 — 캐릭터·룩 이미지는 전부 여기를 지난다. — docs/기획서.md §7
 *
 * **fal과 다른 점: 큐도 웹훅도 없다.** 부르면 이미지가 바로 돌아온다.
 * 그래서 함수는 행만 만들어 두고 배경 작업(`_shared/batch.ts`)에서 채운다.
 * 화면은 fal일 때와 똑같이 Realtime으로 받는다 — 행 구조도 환불도 그대로다.
 *
 * 모델 id를 코드에 박지 않는다. 품질을 올리고 싶으면 시크릿 한 줄만 바꾼다.
 *   gemini-3.1-flash-lite-image  가장 싸다 (1K 전용)
 *   gemini-3.1-flash-image       중간
 *   gemini-3-pro-image           가장 비싸고 지시를 제일 잘 따른다
 */
import { encodeBase64 } from "jsr:@std/encoding/base64";

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/interactions";

/** 화면이 3:4 타일이라 생성도 3:4로 받는다. 1K면 충분하다 — 크기가 곧 돈이다. */
const ASPECT_RATIO = "3:4";
const IMAGE_SIZE = "1K";

export type GeminiConfig = { key: string; model: string };

export type SourceImage = { data: string; mimeType: string };

/**
 * 설정이 없으면 null. 호출부는 **크레딧을 깎기 전에** 이걸 확인해야 한다.
 * 키를 넣기 전에 버튼을 눌러도 크레딧이 날아가지 않게 하려는 것이다.
 */
export function geminiConfig(): GeminiConfig | null {
  const key = Deno.env.get("GEMINI_API_KEY");
  const model = Deno.env.get("GEMINI_IMAGE_MODEL");
  if (!key || !model) return null;
  return { key, model };
}

/**
 * 실패는 코드로 올린다. 이 코드가 그대로 행의 error_code가 되고 화면 문구가 된다 —
 * `src/lib/errors.ts`에 있는 것만 쓴다. — CLAUDE.md 문구 규칙
 */
export class GenerationError extends Error {
  constructor(readonly code: string, message?: string) {
    super(message ?? code);
  }
}

/** 파일 바이트를 모델에 넣을 수 있는 모양으로. private 버킷에서 내려받아 쓴다. */
export function toSourceImage(bytes: ArrayBuffer, mimeType: string): SourceImage {
  return { data: encodeBase64(new Uint8Array(bytes)), mimeType };
}

/** 이미지 한 장. 실패하면 GenerationError를 던진다. */
export async function generateImage(
  config: GeminiConfig,
  args: { prompt: string; image?: SourceImage },
): Promise<{ bytes: ArrayBuffer; contentType: string }> {
  const input: Record<string, unknown>[] = [{ type: "text", text: args.prompt }];
  if (args.image) {
    input.push({
      type: "image",
      mime_type: args.image.mimeType,
      data: args.image.data,
    });
  }

  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "x-goog-api-key": config.key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        input,
        response_format: {
          type: "image",
          mime_type: "image/jpeg",
          aspect_ratio: ASPECT_RATIO,
          image_size: IMAGE_SIZE,
        },
      }),
    });
  } catch (e) {
    throw new GenerationError("UPSTREAM_ERROR", `Gemini 호출 실패: ${e}`);
  }

  if (!res.ok) {
    const body = await res.text();
    // 429는 한도에 걸린 것이다. 사람에게 "잠시 뒤"라고 말할 수 있어야 해서 따로 든다.
    if (res.status === 429) {
      throw new GenerationError("RATE_LIMITED", body.slice(0, 300));
    }
    // 안전 필터는 400으로 온다. 사용자가 고른 조합 문제라 다시 시도해도 같은 결과다.
    if (res.status === 400 && /safety|blocked|policy/i.test(body)) {
      throw new GenerationError("CONTENT_BLOCKED", body.slice(0, 300));
    }
    throw new GenerationError("UPSTREAM_ERROR", `${res.status} ${body.slice(0, 300)}`);
  }

  const payload = await res.json();
  const found = imageFrom(payload);
  // 200인데 그림이 없으면 십중팔구 안전 필터가 텍스트만 돌려준 것이다.
  if (!found) {
    console.error("Gemini 응답에 이미지가 없습니다", JSON.stringify(payload).slice(0, 500));
    throw new GenerationError("CONTENT_BLOCKED");
  }

  return {
    bytes: decodeBase64(found.data).buffer as ArrayBuffer,
    contentType: found.mimeType,
  };
}

/**
 * 응답에서 이미지 하나를 꺼낸다.
 *
 * 새 `interactions` 응답은 `output_image`에, 예전 `generateContent` 응답은
 * `candidates[].content.parts[].inline_data`에 담는다. 둘 다 훑는다 —
 * `_shared/fal.ts`의 `resultUrl()`과 같은 이유이고, **실제 응답을 한 번 보고 나면
 * 그 모양 하나만 남기고 줄이는 게 맞다.**
 */
function imageFrom(payload: unknown): { data: string; mimeType: string } | null {
  const seen = new Set<unknown>();

  const walk = (node: unknown, depth: number): { data: string; mimeType: string } | null => {
    if (depth > 6 || node === null || typeof node !== "object") return null;
    if (seen.has(node)) return null;
    seen.add(node);

    if (Array.isArray(node)) {
      for (const item of node) {
        const found = walk(item, depth + 1);
        if (found) return found;
      }
      return null;
    }

    const record = node as Record<string, unknown>;
    const data = record.data ?? record.image_bytes ?? record.bytesBase64Encoded;
    const mimeType = record.mime_type ?? record.mimeType;
    if (typeof data === "string" && data.length > 256) {
      return {
        data,
        mimeType: typeof mimeType === "string" ? mimeType : "image/jpeg",
      };
    }

    for (const value of Object.values(record)) {
      const found = walk(value, depth + 1);
      if (found) return found;
    }
    return null;
  };

  return walk(payload, 0);
}

function decodeBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
