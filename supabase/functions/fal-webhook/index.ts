/**
 * fal-webhook — 생성이 끝나면 fal이 부른다. 결과를 우리 버킷에 넣고, 실패면 환불한다.
 *
 *   POST /functions/v1/fal-webhook?type=character_image|look|job&id=<uuid>&token=<HMAC>
 *
 * **JWT를 못 쓴다.** fal은 우리 사용자 토큰을 모른다. 그래서 config.toml에서
 * verify_jwt = false로 두고, 대신 공유 시크릿으로 서명한 token을 쿼리에서 확인한다.
 * 어느 행인지도 쿼리로 받는다 — 스키마에 fal request_id 컬럼을 새로 만들지 않기 위해서다.
 *
 * **같은 알림이 두 번 올 수 있다.** 그래서 상태 전이를 조건부로 건다.
 * `update ... where status in ('queued','processing') returning id`가 행을 안 돌려주면
 * 이미 처리된 것이므로 환불을 건너뛴다.
 *
 * 캐릭터는 한 장이 한 행이다(`character_images`). 후보 4장이면 이 웹훅이 네 번 온다.
 * **배치를 끝내는 판단은 여기서 하지 않는다** — SQL 함수 finish_character_batch 한 곳에서만 한다.
 * 마지막 두 장이 동시에 도착해도 캐릭터 행의 조건부 전이에서 한쪽만 이기고,
 * 진 쪽은 'already'를 받아 환불하지 않는다. — docs/기획서.md §5
 */
import { adminClient, refund } from "../_shared/supabase.ts";
import { verifyToken, resultUrl } from "../_shared/fal.ts";

type Subject = "character_image" | "look" | "job";

/** 진행 중인 상태에서만 옮긴다. 이미 done/failed면 행이 안 돌아온다. */
const IN_FLIGHT = ["queued", "processing"];

/** 캐릭터 배치별 비용과 환불 사유. 후보 1 · 수정 1 · 3방향 2 — 기획서 §4 */
const CHARACTER_REFUND: Record<string, { amount: number; reason: string }> = {
  candidate: { amount: 1, reason: "character_draft_refund" },
  refined: { amount: 1, reason: "character_edit_refund" },
  view: { amount: 2, reason: "character_refund" },
};

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  const url = new URL(req.url);
  const type = url.searchParams.get("type") as Subject | null;
  const id = url.searchParams.get("id");
  const token = url.searchParams.get("token");

  if (!type || !id || !["character_image", "look", "job"].includes(type)) {
    return new Response("Bad Request", { status: 400 });
  }
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

  return type === "character_image"
    ? await handleCharacterImage(id, body)
    : await handleJobOrLook(type, id, body);
});

// ---------------------------------------------------------------- 캐릭터

async function handleCharacterImage(
  id: string,
  body: Record<string, unknown>,
): Promise<Response> {
  const admin = adminClient();

  // 이 장을 잡는다. 못 잡으면 이미 누가 처리했거나, 큐 등록에 실패해 접어둔 장이다.
  const { data: image, error: claimError } = await admin
    .from("character_images")
    .update({ status: "processing", updated_at: new Date().toISOString() })
    .eq("id", id)
    .in("status", IN_FLIGHT)
    .select("id, character_id, kind, round")
    .maybeSingle();

  if (claimError) {
    console.error("이미지 전이 실패", claimError);
    return new Response("Error", { status: 500 }); // fal이 다시 부르게 둔다
  }
  if (!image) {
    console.log("이미 처리된 알림", { type: "character_image", id });
    return new Response("OK", { status: 200 });
  }

  const { data: character } = await admin
    .from("characters")
    .select("user_id")
    .eq("id", image.character_id)
    .maybeSingle();
  if (!character) {
    console.error("캐릭터가 없습니다", { image: id });
    return new Response("OK", { status: 200 });
  }
  const userId = character.user_id as string;

  const succeeded = body.status === "OK" || body.status === "COMPLETED";
  const source = succeeded ? resultUrl(body.payload ?? body) : null;

  let patch: Record<string, unknown>;
  if (!succeeded || !source) {
    const code = succeeded ? "UPSTREAM_ERROR" : errorCode(body);
    console.error("생성 실패", { image: id, code, payload: body.payload });
    patch = { status: "failed", error_code: code };
  } else {
    try {
      patch = {
        status: "done",
        image_path: await store(admin, source, `${userId}/${image.character_id}/${id}`),
      };
    } catch (e) {
      console.error("결과 저장 실패", { image: id, e });
      patch = { status: "failed", error_code: "UPSTREAM_ERROR" };
    }
  }

  const { error: finishError } = await admin
    .from("character_images")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (finishError) console.error("이미지 마무리 갱신 실패", { image: id, finishError });

  // 배치가 끝났는지, 끝났다면 캐릭터를 어디로 옮길지는 SQL이 정한다.
  const { data: outcome, error: batchError } = await admin.rpc(
    "finish_character_batch",
    {
      p_character_id: image.character_id,
      p_kind: image.kind,
      p_round: image.round,
    },
  );
  if (batchError) {
    console.error("배치 마무리 실패", { image: id, batchError });
    return new Response("Error", { status: 500 });
  }

  if (outcome === "failed") {
    const { amount, reason } = CHARACTER_REFUND[image.kind as string];
    await refund(admin, userId, amount, reason, `character:${image.character_id}`);
  }

  return new Response("OK", { status: 200 });
}

// ---------------------------------------------------------------- 룩 · 영상

const TABLE: Record<string, string> = { look: "looks", job: "jobs" };
const BUCKET: Record<string, string> = { look: "looks", job: "videos" };
const REFUND_REASON: Record<string, string> = {
  look: "look_refund",
  job: "job_refund",
};
/** 룩 1. job은 행의 credits_spent를 쓴다. */
const COST: Record<string, number> = { look: 1, job: 1 };

async function handleJobOrLook(
  type: string,
  id: string,
  body: Record<string, unknown>,
): Promise<Response> {
  const admin = adminClient();
  const succeeded = body.status === "OK" || body.status === "COMPLETED";

  const { data: claimed, error: claimError } = await admin
    .from(TABLE[type])
    .update({ status: "processing" })
    .eq("id", id)
    .in("status", IN_FLIGHT)
    .select("id, user_id" + (type === "job" ? ", credits_spent" : ""))
    .maybeSingle();

  if (claimError) {
    console.error("상태 전이 실패", claimError);
    return new Response("Error", { status: 500 });
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

  const failed = async (code: string) => {
    await finish({
      status: "failed",
      error_code: code,
      ...(type === "job" ? { completed_at: new Date().toISOString() } : {}),
    });
    await refund(admin, userId, amount, REFUND_REASON[type], `${type}:${id}`);
  };

  if (!succeeded) {
    // fal이 준 코드가 errors.ts에 있으면 그대로, 아니면 UPSTREAM_ERROR.
    // 없는 코드를 넣으면 화면이 기본 문구로 떨어진다. — CLAUDE.md 문구 규칙
    const code = errorCode(body);
    console.error("변환 실패", { type, id, code, body });
    await failed(code);
    return new Response("OK", { status: 200 });
  }

  const source = resultUrl(body.payload ?? body);
  if (!source) {
    // 성공이라는데 파일이 없다. 모델 응답 모양이 예상과 다르다는 뜻이다. — _shared/fal.ts
    console.error("결과 URL을 못 찾음", { type, id, payload: body.payload });
    await failed("UPSTREAM_ERROR");
    return new Response("OK", { status: 200 });
  }

  try {
    const path = await store(admin, source, `${userId}/${id}/result`, BUCKET[type]);
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
    await failed("UPSTREAM_ERROR");
  }

  return new Response("OK", { status: 200 });
}

// ---------------------------------------------------------------- 공통

/**
 * fal이 주는 URL은 만료된다. 우리 버킷으로 옮겨야 나중에도 보인다.
 * 확장자는 받은 Content-Type에서 정한다 — 경로를 DB에 적기 전에 결정돼야 한다.
 */
async function store(
  admin: ReturnType<typeof adminClient>,
  source: string,
  pathWithoutExtension: string,
  bucket = "characters",
): Promise<string> {
  const res = await fetch(source);
  if (!res.ok) throw new Error(`결과 내려받기 실패 ${res.status}`);

  const contentType = res.headers.get("Content-Type") ?? "application/octet-stream";
  const path = `${pathWithoutExtension}.${extensionOf(contentType, bucket)}`;

  const { error } = await admin.storage
    .from(bucket)
    .upload(path, await res.arrayBuffer(), { contentType, upsert: true });
  if (error) throw error;

  return path;
}

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

function extensionOf(contentType: string, bucket: string): string {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("mp4")) return "mp4";
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return "jpg";
  return bucket === "videos" ? "mp4" : "jpg";
}
