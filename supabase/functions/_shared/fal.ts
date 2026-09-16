/**
 * fal.ai — **영상 변환 전용이다.** — docs/기획서.md §7
 *
 * 이미지(캐릭터 후보·수정·3방향·룩)는 Gemini로 옮겼다(`_shared/gemini.ts`).
 * fal이 남아 있는 이유는 하나뿐이다: 영상에서 사람을 캐릭터로 갈아끼우는
 * **Wan-Animate Replace**는 무료로 대체할 게 없다.
 *
 * 변환은 1~3분이 걸려서 응답을 기다리지 않는다. 큐에 넣고 바로 돌아오고,
 * 끝나면 fal이 우리 웹훅(`fal-webhook`)을 부른다. 웹은 그동안 Realtime으로 status만 본다.
 *
 * **job을 큐에 넣는 쪽은 이 레포가 아니라 앱이다.** 여기 있는 건 돌아온 알림을
 * 확인하고 결과를 꺼내는 데 필요한 것뿐이다. 웹에서 영상을 만들게 되면
 * 그때 `submit()`을 되살린다 — git 히스토리의 create-character에 같은 모양이 있다.
 */

/** 웹훅이 돌아와서 고칠 행이 어느 테이블인가. 지금은 영상 하나뿐이다. */
export type WebhookSubject = "job";

/** 웹훅이 돌아올 주소. 어느 행인지와 위조 방지 토큰을 쿼리에 싣는다. */
export async function webhookUrl(
  type: WebhookSubject,
  id: string,
): Promise<string> {
  const base = Deno.env.get("SUPABASE_URL")!;
  const url = new URL(`${base}/functions/v1/fal-webhook`);
  url.searchParams.set("type", type);
  url.searchParams.set("id", id);
  url.searchParams.set("token", await signToken(type, id));
  return url.toString();
}

/**
 * 웹훅은 JWT 검증을 끌 수밖에 없다(fal이 우리 토큰을 모른다).
 * 대신 공유 시크릿으로 서명한 토큰을 쿼리에 실어 확인한다.
 */
export async function signToken(type: string, id: string): Promise<string> {
  const secret = Deno.env.get("WEBHOOK_SECRET");
  if (!secret) throw new Error("WEBHOOK_SECRET이 없습니다");

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${type}:${id}`),
  );
  return [...new Uint8Array(mac)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** 길이가 달라도 일찍 빠져나가지 않게 비교한다. */
export async function verifyToken(
  type: string,
  id: string,
  token: string | null,
): Promise<boolean> {
  if (!token) return false;
  const expected = await signToken(type, id);
  if (expected.length !== token.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ token.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * 결과에서 파일 URL 하나를 꺼낸다.
 *
 * Wan-Animate의 응답 모양을 아직 눈으로 못 봤다. fal 모델마다
 * `video.url` · `output.url` · `url`로 제각각이라 흔한 모양을 훑는다.
 * 못 찾으면 null — 호출부가 UPSTREAM_ERROR로 실패 처리하고 환불한다.
 * 실제 응답을 한 번 보고 나면 그 모양 하나만 남기고 줄이는 게 맞다.
 */
export function resultUrl(payload: unknown): string | null {
  const seen = new Set<unknown>();
  const walk = (node: unknown, depth: number): string | null => {
    if (depth > 4 || node === null || typeof node !== "object") return null;
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
    const url = record.url;
    if (typeof url === "string" && url.startsWith("http")) return url;

    for (const key of ["video", "output", "data"]) {
      if (key in record) {
        const found = walk(record[key], depth + 1);
        if (found) return found;
      }
    }
    return null;
  };
  return walk(payload, 0);
}
