/**
 * create-character — 크레딧 차감 + characters INSERT + fal.ai 큐 등록
 *
 * 화면 계약 (`src/components/app/CharacterForm.tsx`)
 *   body     { name, refs: { front, left45, right45, left90, right90 } }  값은 Storage 경로
 *   응답     { character_id }
 *   비용     2크레딧 · 원장 사유 character_charge
 *
 * 순서가 중요하다. 실패했을 때 크레딧이 남아 있으면 안 되고,
 * 성공하지 않았는데 깎여 있어도 안 된다.
 *   1. 누구인지 · 입력이 온전한지    — 여기서 막히면 아무것도 안 깎는다
 *   2. fal 설정이 있는지             — 모델을 안 고른 상태에서 깎지 않는다
 *   3. 차감                          — SQL 함수 한 문장
 *   4. characters + character_refs   — 실패하면 환불
 *   5. fal 큐 등록                   — 실패하면 status=failed + 환불
 */
import { preflight, ok, fail } from "../_shared/http.ts";
import { adminClient, callerId, charge, refund } from "../_shared/supabase.ts";
import { falConfig, submit, webhookUrl } from "../_shared/fal.ts";

const COST = 2;
const ANGLES = ["front", "left45", "right45", "left90", "right90"] as const;
const ONE_HOUR = 60 * 60;

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;

  const userId = await callerId(req);
  if (!userId) return fail(req, 401, "SESSION_EXPIRED");

  let body: { name?: unknown; refs?: unknown };
  try {
    body = await req.json();
  } catch {
    return fail(req, 400, "REF_INCOMPLETE");
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name || name.length > 20) return fail(req, 400, "REF_INCOMPLETE");

  // 5각도가 다 있어야 한다. 하나라도 비면 REF_INCOMPLETE.
  const refs = (body.refs ?? {}) as Record<string, unknown>;
  const paths: string[] = [];
  for (const angle of ANGLES) {
    const path = refs[angle];
    if (typeof path !== "string" || !path) return fail(req, 400, "REF_INCOMPLETE");
    // 남의 폴더를 가리키지 못하게 한다. Storage 정책이 업로드는 막지만
    // 경로 문자열은 클라이언트가 보내는 값이라 여기서 한 번 더 본다.
    if (!path.startsWith(`${userId}/`)) return fail(req, 400, "REF_INCOMPLETE");
    paths.push(path);
  }

  // 모델을 안 고른 상태에서는 깎기 전에 멈춘다. — README 4번 "아직 못 정한 것"
  const fal = falConfig("character");
  if (!fal) {
    console.error("FAL_KEY 또는 FAL_CHARACTER_MODEL이 없습니다");
    return fail(req, 503, "UPSTREAM_ERROR");
  }

  const admin = adminClient();
  // 차감과 INSERT가 같은 id를 가리켜야 원장에서 되짚을 수 있다. 먼저 정해 둔다.
  const characterId = crypto.randomUUID();
  const memo = `character:${characterId}`;

  const balance = await charge(admin, userId, COST, "character_charge", memo);
  if (balance === null) return fail(req, 402, "INSUFFICIENT_CREDITS");

  const { error: insertError } = await admin.from("characters").insert({
    id: characterId,
    user_id: userId,
    name,
    status: "queued",
  });
  if (insertError) {
    console.error("characters INSERT 실패", insertError);
    await refund(admin, userId, COST, "character_refund", memo);
    return fail(req, 500, "UPSTREAM_ERROR");
  }

  const { error: refsError } = await admin.from("character_refs").insert(
    ANGLES.map((angle, i) => ({
      character_id: characterId,
      angle,
      image_path: paths[i],
    })),
  );
  if (refsError) {
    console.error("character_refs INSERT 실패", refsError);
    await admin.from("characters").delete().eq("id", characterId);
    await refund(admin, userId, COST, "character_refund", memo);
    return fail(req, 500, "UPSTREAM_ERROR");
  }

  try {
    // 버킷이 private이라 fal이 경로로는 못 읽는다. 서명 URL을 만들어 넘긴다.
    const { data: signed, error: signError } = await admin.storage
      .from("characters")
      .createSignedUrls(paths, ONE_HOUR);
    if (signError || !signed) throw signError ?? new Error("서명 URL 생성 실패");

    const imageUrls = signed.map((s) => s.signedUrl).filter(Boolean);
    if (imageUrls.length !== ANGLES.length) {
      throw new Error("레퍼런스 서명 URL이 5개가 아닙니다");
    }

    // 입력 모양은 고른 모델에 맞춰야 한다. 모델이 정해지면 여기부터 고친다. — README 4번
    await submit(
      fal,
      { image_urls: imageUrls, prompt: name },
      await webhookUrl("character", characterId),
    );
  } catch (e) {
    console.error("fal 큐 등록 실패", e);
    await admin
      .from("characters")
      .update({ status: "failed", error_code: "UPSTREAM_ERROR" })
      .eq("id", characterId);
    await refund(admin, userId, COST, "character_refund", memo);
    return fail(req, 502, "UPSTREAM_ERROR");
  }

  return ok(req, { character_id: characterId });
});
