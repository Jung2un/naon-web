import { encodeBase64 } from "jsr:@std/encoding/base64";

const ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/interactions";
export const DEFAULT_IMAGE_MODEL = "gemini-3.1-flash-image";
export type GeminiConfig = { key: string; model: string };
export type SourceImage = { data: string; mimeType: string };

export function geminiConfig(): GeminiConfig | null {
  const key = Deno.env.get("GEMINI_API_KEY")?.trim();
  const model = Deno.env.get("GEMINI_IMAGE_MODEL")?.trim() ||
    DEFAULT_IMAGE_MODEL;
  return key ? { key, model } : null;
}

export class GenerationError extends Error {
  constructor(readonly code: string, message?: string) {
    super(message ?? code);
  }
}

export function toSourceImage(
  bytes: ArrayBuffer,
  mimeType: string,
): SourceImage {
  return { data: encodeBase64(new Uint8Array(bytes)), mimeType };
}

/** Parse only documented image outputs, never arbitrary base64 fields. */
export function imageFrom(payload: unknown): SourceImage | null {
  if (!payload || typeof payload !== "object") return null;
  const body = payload as Record<string, unknown>;
  const image = (value: unknown): SourceImage | null => {
    if (!value || typeof value !== "object") return null;
    const row = value as Record<string, unknown>;
    const mime = row.mime_type ?? row.mimeType;
    return typeof row.data === "string" && typeof mime === "string" &&
        ["image/png", "image/jpeg", "image/webp"].includes(mime)
      ? { data: row.data, mimeType: mime }
      : null;
  };
  const direct = image(body.output_image);
  if (direct) return direct;
  // Raw REST exposes steps; SDK convenience output_image is not always present.
  for (const step of Array.isArray(body.steps) ? body.steps : []) {
    if (step?.type !== "model_output") continue;
    const content = step.content;
    for (const part of Array.isArray(content) ? content : [content]) {
      if (part?.type === "image") {
        const found = image(part);
        if (found) return found;
      }
    }
  }
  return null;
}

export async function generateImage(
  config: GeminiConfig,
  args: { prompt: string; image?: SourceImage },
): Promise<{ bytes: ArrayBuffer; contentType: string }> {
  const input: Record<string, unknown>[] = [{
    type: "text",
    text: args.prompt,
  }];
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
      signal: AbortSignal.timeout(110_000),
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
          aspect_ratio: "3:4",
          image_size: "1K",
        },
      }),
    });
  } catch (error) {
    throw new GenerationError(
      error instanceof DOMException && error.name === "TimeoutError"
        ? "TIMEOUT"
        : "UPSTREAM_ERROR",
    );
  }
  if (!res.ok) {
    const body = await res.text();
    if (res.status === 429) throw new GenerationError("RATE_LIMITED");
    if ([401, 403].includes(res.status)) {
      throw new GenerationError("AI_NOT_CONFIGURED");
    }
    if (res.status === 400 && /safety|blocked|policy/i.test(body)) {
      throw new GenerationError("CONTENT_BLOCKED");
    }
    // Never include upstream bodies, source images or credentials in logs.
    throw new GenerationError("UPSTREAM_ERROR", `Gemini HTTP ${res.status}`);
  }
  const payload = await res.json();
  const found = imageFrom(payload);
  if (!found) {
    throw new GenerationError(
      payload.status === "failed" ? "UPSTREAM_ERROR" : "CONTENT_BLOCKED",
    );
  }
  try {
    const bytes = Uint8Array.from(atob(found.data), (c) => c.charCodeAt(0));
    if (!bytes.length) throw new Error("Empty image");
    return { bytes: bytes.buffer, contentType: found.mimeType };
  } catch {
    throw new GenerationError("UPSTREAM_ERROR", "Invalid image response");
  }
}
