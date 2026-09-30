import { type ErrorCode, fail, ok, preflight } from "../_shared/http.ts";
import { adminClient, callerId } from "../_shared/supabase.ts";
import { VIDEO_MODEL, webhookUrl } from "../_shared/fal.ts";
import { mp4Duration, readLimited, validSourcePath } from "../_shared/video.ts";

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== "POST") return new Response(null, { status: 405 });
  const userId = await callerId(req);
  if (!userId) return fail(req, 401, "SESSION_EXPIRED");
  const key = Deno.env.get("FAL_KEY");
  if (!key || !Deno.env.get("WEBHOOK_SECRET")) {
    return fail(req, 503, "AI_NOT_CONFIGURED");
  }
  let body;
  try {
    body = await req.json();
  } catch {
    return fail(req, 400, "VIDEO_INVALID");
  }
  const { job_id: id, character_id: characterId, source_path: path } = body ??
    {};
  const lookId = body?.look_id || null;
  if (
    typeof id !== "string" || typeof characterId !== "string" ||
    !validSourcePath(userId, id, path)
  ) return fail(req, 400, "VIDEO_INVALID");
  const admin = adminClient();
  try {
    // A retry returns the original job rather than another paid provider request.
    const { data: existing, error: existingError } = await admin.from("jobs")
      .select("id,user_id,character_id,look_id,source_video_path").eq("id", id)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existing) {
      if (
        existing.user_id !== userId || existing.character_id !== characterId ||
        existing.look_id !== lookId || existing.source_video_path !== path
      ) return fail(req, 400, "VIDEO_INVALID");
      return ok(req, { job_id: id });
    }
    const { data: character } = await admin.from("characters").select(
      "base_image_path,thumbnail_path,status,stage",
    ).eq("id", characterId).eq("user_id", userId).is("deleted_at", null).maybeSingle();
    if (character?.stage !== "ready" || character?.status !== "done") {
      return fail(req, 409, "CHARACTER_NOT_READY");
    }
    let imagePath = character.base_image_path || character.thumbnail_path;
    let bucket = "characters";
    if (lookId) {
      const { data: look } = await admin.from("looks").select(
        "thumbnail_path,status",
      ).eq("id", lookId).eq("user_id", userId).eq("character_id", characterId)
        .maybeSingle();
      if (look?.status !== "done" || !look.thumbnail_path) {
        return fail(req, 400, "LOOK_INCOMPLETE");
      }
      imagePath = look.thumbnail_path;
      bucket = "looks";
    }
    if (!imagePath) return fail(req, 409, "CHARACTER_NOT_READY");
    const [video, image] = await Promise.all([
      admin.storage.from("videos").createSignedUrl(path, 3600),
      admin.storage.from(bucket).createSignedUrl(imagePath, 3600),
    ]);
    if (video.error || image.error || !video.data || !image.data) {
      return fail(req, 400, "VIDEO_INVALID");
    }
    const bytes = await readLimited(
      await fetch(video.data.signedUrl, {
        signal: AbortSignal.timeout(30_000),
      }),
      50 * 1024 * 1024,
    );
    const duration = mp4Duration(bytes);
    if (duration === null) return fail(req, 400, "VIDEO_INVALID");
    if (duration < 3) return fail(req, 400, "VIDEO_TOO_SHORT");
    if (duration > 10) return fail(req, 400, "VIDEO_TOO_LONG");
    // Generate HMAC before charging. The token is never returned to the client.
    const callback = await webhookUrl("job", id);
    const { data: created, error } = await admin.rpc("begin_video_job", {
      p_user_id: userId,
      p_id: id,
      p_character_id: characterId,
      p_look_id: lookId,
      p_source_path: path,
      p_duration: duration,
      p_model: VIDEO_MODEL,
    });
    if (error) {
      const known: ErrorCode[] = [
        "INSUFFICIENT_CREDITS",
        "VIDEO_BUSY",
        "CHARACTER_NOT_READY",
        "LOOK_INCOMPLETE",
        "VIDEO_INVALID",
      ];
      const code = known.find((c) => error.message.includes(c));
      return fail(
        req,
        code === "INSUFFICIENT_CREDITS" ? 402 : code ? 409 : 500,
        code ?? "UPSTREAM_ERROR",
      );
    }
    if (!created) return ok(req, { job_id: id });
    const endpoint = new URL(`https://queue.fal.run/${VIDEO_MODEL}`);
    endpoint.searchParams.set("fal_webhook", callback);
    // Do not automatically retry ambiguous queue failures: the request may already be accepted.
    let response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        signal: AbortSignal.timeout(25_000),
        headers: {
          Authorization: `Key ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          video_url: video.data.signedUrl,
          image_url: image.data.signedUrl,
          resolution: "720p",
          // 이 엔드포인트는 프롬프트를 받지 않는다. 품질 손잡이는 이 둘뿐이다 — 기본 20단계·high.
          // 30단계는 얼굴(눈·입가)의 깜빡임을 줄이는 대신 처리 시간이 는다. 요금이 단계 수를 따르는지는 fal 가격표에서 본다.
          num_inference_steps: 30,
          video_quality: "high",
          enable_safety_checker: true,
        }),
      });
    } catch {
      console.error("Video queue acknowledgement missing", { id });
      return ok(req, { job_id: id, pending_confirmation: true });
    }
    if (!response.ok) {
      // 5xx may have accepted work; wait for callback/operator reconciliation.
      if (response.status >= 500) {
        return ok(req, { job_id: id, pending_confirmation: true });
      }
      const code = response.status === 429
        ? "RATE_LIMITED"
        : [401, 403].includes(response.status)
        ? "AI_NOT_CONFIGURED"
        : "UPSTREAM_ERROR";
      const { error: settleError } = await admin.rpc("finish_video_job", {
        p_id: id,
        p_error: code,
      });
      if (settleError) throw settleError;
      return ok(req, { job_id: id });
    }
    const result = await response.json().catch(() => null);
    if (typeof result?.request_id === "string") {
      const { error: updateError } = await admin.from("jobs").update({
        provider_request_id: result.request_id,
        status: "processing",
        started_at: new Date().toISOString(),
      }).eq("id", id).in("status", ["queued", "processing"]);
      if (updateError) {
        console.error("Video request ID persistence failed", { id });
      }
    }
    return ok(req, { job_id: id });
  } catch {
    console.error("Video submission failed", { id });
    return fail(req, 500, "UPSTREAM_ERROR");
  }
});
