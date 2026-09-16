/**
 * fal.ai 큐 호출과 웹훅 서명.
 *
 * 변환은 1~3분이 걸려서 응답을 기다리지 않는다. 큐에 넣고 바로 돌아오고,
 * 끝나면 fal이 우리 웹훅을 부른다. 웹은 그동안 Realtime으로 status만 본다.
 */

/** 모델 ID는 코드에 박지 않는다. 아직 정해진 적이 없다 — README 4번 */
export type FalKind = "character" | "look";

export type FalConfig = { key: string; model: string };

/**
 * 설정이 없으면 null. 호출부는 **크레딧을 깎기 전에** 이걸 확인해야 한다.
 * 모델을 고르기 전에 버튼을 눌러도 크레딧이 날아가지 않게 하려는 것이다.
 */
export function falConfig(kind: FalKind): FalConfig | null {
  const key = Deno.env.get("FAL_KEY");
  const model = Deno.env.get(
    kind === "character" ? "FAL_CHARACTER_MODEL" : "FAL_LOOK_MODEL",
  );
  if (!key || !model) return null;
  return { key, model };
}

/** 웹훅이 돌아올 주소. 어느 행인지와 위조 방지 토큰을 쿼리에 싣는다. */
export async function webhookUrl(type: FalKind, id: string): Promise<string> {
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

/** 큐에 넣는다. 성공하면 fal의 request_id. */
export async function submit(
  config: FalConfig,
  input: Record<string, unknown>,
  callback: string,
): Promise<string> {
  const url = new URL(`https://queue.fal.run/${config.model}`);
  url.searchParams.set("fal_webhook", callback);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Key ${config.key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    throw new Error(`fal 큐 등록 실패 ${res.status}: ${await res.text()}`);
  }
  const body = await res.json();
  return String(body.request_id ?? "");
}

/**
 * 결과에서 파일 URL 하나를 꺼낸다.
 *
 * 모델이 아직 안 정해져서 응답 모양을 확정할 수 없다. fal 모델마다
 * `images[0].url` · `image.url` · `video.url` · `url`로 제각각이라 흔한 모양을 훑는다.
 * 못 찾으면 null — 호출부가 UPSTREAM_ERROR로 실패 처리하고 환불한다.
 * 모델이 정해지면 그 모델의 모양 하나만 남기고 이 함수를 줄이는 게 맞다.
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

    for (const key of ["images", "image", "video", "output", "data"]) {
      if (key in record) {
        const found = walk(record[key], depth + 1);
        if (found) return found;
      }
    }
    return null;
  };
  return walk(payload, 0);
}
