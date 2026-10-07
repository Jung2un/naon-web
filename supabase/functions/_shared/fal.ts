/** Video queue model and authenticated callback helpers. */
// Animate Replace replaces the entire person, including the reference outfit,
// and has no prompt field. Use localized, instruction-based video editing.
// Contract: https://fal.ai/models/fal-ai/wan-vace-apps/video-edit/api
export const VIDEO_MODEL = "fal-ai/wan-vace-apps/video-edit";

export function videoEditInput(videoUrl: string, characterImageUrl: string) {
  return {
    video_url: videoUrl,
    image_urls: [characterImageUrl],
    prompt: [
      "Edit only the face and hair of the single person in the input video to match the identity in the reference image",
      "The reference image supplies facial identity and hairstyle ONLY; ignore its clothing, body pose, background and lighting",
      "Keep the original video's clothing and accessories exactly unchanged in every frame: same garments, neckline, sleeves, colors, patterns, logos, fabric, folds, shoes and jewelry",
      "Do not dress the person in the reference image's outfit; do not replace or restyle the body",
      "Preserve the source video's body, hands, pose, gestures, facial performance, timing, camera movement, framing, lighting and background",
      "Blend only the new face and hair naturally into the original footage, with temporally consistent facial identity",
    ].join(". "),
    video_type: "human",
    resolution: "720p",
    aspect_ratio: "auto",
    acceleration: "none",
    enable_safety_checker: true,
  };
}

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

/** Only accept the documented video URL from fal storage. */
export function resultUrl(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const source = (payload as { video?: { url?: unknown } }).video?.url;
  if (typeof source !== "string") return null;
  try {
    const url = new URL(source);
    return url.protocol === "https:" && !url.username && !url.password &&
        !url.port &&
        (url.hostname === "fal.media" || url.hostname.endsWith(".fal.media") ||
          (url.hostname === "storage.googleapis.com" &&
            url.pathname.startsWith("/falserverless/")))
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}
