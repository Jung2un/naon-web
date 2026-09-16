/**
 * fal-webhook — 영상 변환이 끝나면 fal이 부른다. 결과를 우리 버킷에 넣고, 실패면 환불한다.
 *
 *   POST /functions/v1/fal-webhook?type=job&id=<uuid>&token=<HMAC>
 *
 * **이제 영상만 다룬다.** 캐릭터·룩 이미지는 Gemini로 옮겨서 큐도 웹훅도 안 쓴다 —
 * 함수가 행을 만들고 배경에서 직접 채운다. — docs/기획서.md §7
 *
 * **JWT를 못 쓴다.** fal은 우리 사용자 토큰을 모른다. 그래서 config.toml에서
 * verify_jwt = false로 두고, 대신 공유 시크릿으로 서명한 token을 쿼리에서 확인한다.
 * 어느 행인지도 쿼리로 받는다 — 스키마에 fal request_id 컬럼을 새로 만들지 않기 위해서다.
 *
 * **같은 알림이 두 번 올 수 있다.** 그래서 상태 전이를 조건부로 건다.
 * `update ... where status in ('queued','processing') returning id`가 행을 안 돌려주면
 * 이미 처리된 것이므로 환불을 건너뛴다. 이게 이중 환불을 막는 유일한 장치다.
 */
import { adminClient, refund } from "../_shared/supabase.ts";
import { verifyToken, resultUrl } from "../_shared/fal.ts";

/** 진행 중인 상태에서만 옮긴다. 이미 done/failed면 행이 안 돌아온다. */
const IN_FLIGHT = ["queued", "processing"];

/** 영상 변환 1크레딧. 실제 값은 행의 credits_spent를 쓴다. — README 크레딧 표 */
const DEFAULT_COST = 1;

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const id = url.searchParams.get("id");
  const token = url.searchParams.get("token");

  if (type !== "job" || !id) return new Response("Bad Request", { status: 400 });
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

  // 먼저 이 행을 잡는다. 여기서 못 잡으면 이미 누가 처리한 것이다.
  const { data: claimed, error: claimError } = await admin
    .from("jobs")
    .update({ status: "processing", started_at: new Date().toISOString() })
    .eq("id", id)
    .in("status", IN_FLIGHT)
    .select("id, user_id, credits_spent")
    .maybeSingle();

  if (claimError) {
    console.error("상태 전이 실패", claimError);
    return new Response("Error", { status: 500 }); // fal이 다시 부르게 둔다
  }
  if (!claimed) {
    console.log("이미 처리된 알림", { type, id });
    return new Response("OK", { status: 200 });
  }

  const userId = claimed.user_id as string;
  const amount = (claimed.credits_spent as number | null) ?? DEFAULT_COST;

  const finish = async (patch: Record<string, unknown>) => {
    const { error } = await admin
      .from("jobs")
      .update({ ...patch, completed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) console.error("마무리 갱신 실패", { id, error });
  };

  const failed = async (code: string) => {
    await finish({ status: "failed", error_code: code });
    await refund(admin, userId, amount, "job_refund", `job:${id}`);
  };

  if (body.status !== "OK" && body.status !== "COMPLETED") {
    // fal이 준 코드가 errors.ts에 있으면 그대로, 아니면 UPSTREAM_ERROR.
    // 없는 코드를 넣으면 화면이 기본 문구로 떨어진다. — CLAUDE.md 문구 규칙
    const code = errorCode(body);
    console.error("변환 실패", { id, code, body });
    await failed(code);
    return new Response("OK", { status: 200 });
  }

  const source = resultUrl(body.payload ?? body);
  if (!source) {
    // 성공이라는데 파일이 없다. 모델 응답 모양이 예상과 다르다는 뜻이다. — _shared/fal.ts
    console.error("결과 URL을 못 찾음", { id, payload: body.payload });
    await failed("UPSTREAM_ERROR");
    return new Response("OK", { status: 200 });
  }

  try {
    // fal이 주는 URL은 만료된다. 우리 버킷으로 옮겨야 나중에도 보인다.
    const res = await fetch(source);
    if (!res.ok) throw new Error(`결과 내려받기 실패 ${res.status}`);

    const contentType = res.headers.get("Content-Type") ?? "video/mp4";
    const path = `${userId}/${id}/result.${contentType.includes("webm") ? "webm" : "mp4"}`;

    const { error: uploadError } = await admin.storage
      .from("videos")
      .upload(path, await res.arrayBuffer(), { contentType, upsert: true });
    if (uploadError) throw uploadError;

    await finish({ status: "done", result_video_path: path });
  } catch (e) {
    console.error("결과 저장 실패", { id, e });
    await failed("UPSTREAM_ERROR");
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
]);

function errorCode(body: Record<string, unknown>): string {
  const raw = body.error ?? body.payload_error;
  const code = typeof raw === "string" ? raw : (raw as { code?: string })?.code;
  return code && KNOWN.has(code) ? code : "UPSTREAM_ERROR";
}
