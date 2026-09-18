import { adminClient } from "../_shared/supabase.ts";
import { resultUrl, verifyToken } from "../_shared/fal.ts";
import { readLimited } from "../_shared/video.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response(null, { status: 405 });
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (url.searchParams.get("type") !== "job" || !id) {
    return new Response(null, { status: 400 });
  }
  try {
    if (!await verifyToken("job", id, url.searchParams.get("token"))) {
      return new Response(null, { status: 403 });
    }
    const body = await req.json();
    const admin = adminClient();
    const { data: job, error } = await admin.from("jobs").select(
      "user_id,status,provider_request_id",
    ).eq("id", id).maybeSingle();
    if (error) throw error;
    if (!job || ["done", "failed"].includes(job.status)) {
      return new Response("OK");
    }
    if (
      job.provider_request_id && job.provider_request_id !== body.request_id
    ) return new Response(null, { status: 403 });
    if (!["OK", "ERROR", "COMPLETED"].includes(body.status)) {
      return new Response(null, { status: 400 });
    }
    if (body.status === "ERROR") {
      const { error: settleError } = await admin.rpc("finish_video_job", {
        p_id: id,
        p_error: "UPSTREAM_ERROR",
      });
      if (settleError) throw settleError;
      return new Response("OK");
    }
    const source = resultUrl(body.payload ?? body);
    if (!source) throw new Error("Missing output");
    const response = await fetch(source, {
      signal: AbortSignal.timeout(45_000),
      redirect: "error",
    });
    const type = response.headers.get("content-type")?.split(";")[0];
    if (type !== "video/mp4" && type !== "video/webm") {
      throw new Error("Invalid result type");
    }
    const data = await readLimited(response, 100 * 1024 * 1024);
    const path = `${job.user_id}/${id}/result.${
      type === "video/webm" ? "webm" : "mp4"
    }`;
    const { error: uploadError } = await admin.storage.from("videos").upload(
      path,
      data,
      { contentType: type, upsert: true },
    );
    if (uploadError) throw uploadError;
    const { error: settleError } = await admin.rpc("finish_video_job", {
      p_id: id,
      p_result_path: path,
    });
    if (settleError) throw settleError;
    return new Response("OK");
  } catch {
    // Storage/network/DB failures must be retried, not refunded as model failures.
    console.error("Video callback needs retry", { id });
    return new Response("Retry", { status: 500 });
  }
});
