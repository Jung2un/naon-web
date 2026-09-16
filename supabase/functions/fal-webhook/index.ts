/**
 * fal-webhook — 변환이 끝나면 fal이 부른다. 상태를 갱신하고, 실패면 환불한다.
 *
 *   POST /functions/v1/fal-webhook?type=character|look|job&id=<uuid>&token=<HMAC>
 *
 * **JWT를 못 쓴다.** fal은 우리 사용자 토큰을 모른다. 그래서 config.toml에서
 * verify_jwt = false로 두고, 대신 공유 시크릿으로 서명한 token을 쿼리에서 확인한다.
 * 어느 행인지도 쿼리로 받는다 — 스키마에 fal request_id 컬럼을 새로 만들지 않기 위해서다.
 *
 * **같은 알림이 두 번 올 수 있다.** 그래서 상태 전이를 조건부로 건다.
 * `update ... where status in ('queued','processing') returning id`가 행을 안 돌려주면
 * 이미 처리된 것이므로 환불을 건너뛴다. 이게 이중 환불을 막는 유일한 장치다 —
 * credit_ledger.job_id는 jobs만 가리켜서 캐릭터·룩은 원장으로 막을 수 없다.
 */
import { adminClient, refund } from "../_shared/supabase.ts";
import { verifyToken, resultUrl } from "../_shared/fal.ts";

type Subject = "character" | "look" | "job";

const TABLE: Record<Subject, string> = {
  character: "characters",
  look: "looks",
  job: "jobs",
};
const BUCKET: Record<Subject, string> = {
  character: "characters",
  look: "looks",
  job: "videos",
};
const REFUND_REASON: Record<Subject, string> = {
  character: "character_refund",
  look: "look_refund",
  job: "job_refund",
};
/** 캐릭터 2 · 룩 1. job은 행의 credits_spent를 쓴다. — README 4번 크레딧 표 */
const COST: Record<Subject, number> = { character: 2, look: 1, job: 1 };

/** 진행 중인 상태에서만 옮긴다. 이미 done/failed면 행이 안 돌아온다. */
const IN_FLIGHT = ["queued", "processing"];

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  const url = new URL(req.url);
  const type = url.searchParams.get("type") as Subject | null;
  const id = url.searchParams.get("id");
  const token = url.searchParams.get("token");

  if (!type || !id || !(type in TABLE)) return new Response("Bad Request", { status: 400 });
  if (!(await verifyToken(type, id, token))) {
    console.error("웹훅 토큰 불일치", { type, id });
    return new Response("Forbidden", { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  const admin = adminClient();
  const succeeded = body.status === "OK" || body.status === "COMPLETED";

  // 먼저 이 행을 잡는다. 여기서 못 잡으면 이미 누가 처리한 것이다.
  const { data: claimed, error: claimError } = await admin
    .from(TABLE[type])
    .update({ status: "processing" })
    .eq("id", id)
    .in("status", IN_FLIGHT)
    .select("id, user_id" + (type === "job" ? ", credits_spent" : ""))
    .maybeSingle();

  if (claimError) {
    console.error("상태 전이 실패", claimError);
    return new Response("Error", { status: 500 }); // fal이 다시 부르게 둔다
  }
  if (!claimed) {
    console.log("이미 처리된 알림", { type, id });
    return new Response("OK", { status: 200 });
  }

  const userId = (claimed as { user_id: string }).user_id;
  const amount =
    type === "job"
      ? ((claimed as { credits_spent?: number }).credits_spent ?? COST.job)
      : COST[type];

  const finish = async (patch: Record<string, unknown>) => {
    const { error } = await admin.from(TABLE[type]).update(patch).eq("id", id);
    if (error) console.error("마무리 갱신 실패", { type, id, error });
  };

  if (!succeeded) {
    // fal이 준 코드가 errors.ts에 있으면 그대로, 아니면 UPSTREAM_ERROR.
    // 없는 코드를 넣으면 화면이 기본 문구로 떨어진다. — CLAUDE.md 문구 규칙
    const code = errorCode(body);
    console.error("변환 실패", { type, id, code, body });
    await finish({
      status: "failed",
      error_code: code,
      ...(type === "job" ? { completed_at: new Date().toISOString() } : {}),
    });
    await refund(admin, userId, amount, REFUND_REASON[type], `${type}:${id}`);
    return new Response("OK", { status: 200 });
  }

  const source = resultUrl(body.payload ?? body);
  if (!source) {
    // 성공이라는데 파일이 없다. 모델 응답 모양이 예상과 다르다는 뜻이다. — _shared/fal.ts
    console.error("결과 URL을 못 찾음", { type, id, payload: body.payload });
    await finish({
      status: "failed",
      error_code: "UPSTREAM_ERROR",
      ...(type === "job" ? { completed_at: new Date().toISOString() } : {}),
    });
    await refund(admin, userId, amount, REFUND_REASON[type], `${type}:${id}`);
    return new Response("OK", { status: 200 });
  }

  try {
    // fal이 주는 URL은 만료된다. 우리 버킷으로 옮겨야 나중에도 보인다.
    const res = await fetch(source);
    if (!res.ok) throw new Error(`결과 내려받기 실패 ${res.status}`);

    const contentType = res.headers.get("Content-Type") ?? "application/octet-stream";
    const path = `${userId}/${id}/result.${extensionOf(contentType, type)}`;

    const { error: uploadError } = await admin.storage
      .from(BUCKET[type])
      .upload(path, await res.arrayBuffer(), { contentType, upsert: true });
    if (uploadError) throw uploadError;

    await finish(
      type === "job"
        ? {
            status: "done",
            result_video_path: path,
            completed_at: new Date().toISOString(),
          }
        : { status: "done", thumbnail_path: path },
    );
  } catch (e) {
    console.error("결과 저장 실패", { type, id, e });
    await finish({
      status: "failed",
      error_code: "UPSTREAM_ERROR",
      ...(type === "job" ? { completed_at: new Date().toISOString() } : {}),
    });
    await refund(admin, userId, amount, REFUND_REASON[type], `${type}:${id}`);
  }

  return new Response("OK", { status: 200 });
});

/** errors.ts에 문구가 있는 코드만 통과시킨다. */
const KNOWN = new Set([
  "FAL_422",
  "FACE_NOT_FOUND",
  "MULTIPLE_FACES",
  "VIDEO_TOO_LONG",
  "VIDEO_TOO_SHORT",
  "LOW_RESOLUTION",
  "TIMEOUT",
  "UPSTREAM_ERROR",
  "REF_FACE_MISMATCH",
]);

function errorCode(body: Record<string, unknown>): string {
  const raw = body.error ?? body.payload_error;
  const code = typeof raw === "string" ? raw : (raw as { code?: string })?.code;
  return code && KNOWN.has(code) ? code : "UPSTREAM_ERROR";
}

function extensionOf(contentType: string, type: Subject): string {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("mp4")) return "mp4";
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return "jpg";
  return type === "job" ? "mp4" : "jpg";
}
