/**
 * refine-character — 고른 얼굴을 유지한 채 속성만 고친다. 캐릭터 만들기의 3단계다.
 *
 * 화면 계약 (`src/components/app/CharacterStudio.tsx`)
 *   body     { character_id, traits }
 *   응답     { image_id }
 *   비용     1크레딧 · 원장 사유 character_edit_charge
 *
 * **바뀐 것만 지시문으로 만든다.** 전체 설명을 다시 넘기면 편집 모델이 얼굴까지 새로 그린다.
 * 바꾼 게 하나도 없으면 깎기 전에 NO_CHANGES로 돌려준다 — 같은 그림에 크레딧을 받을 수 없다.
 *
 * 성별·나이대·톤은 여기서 못 바꾼다. 그건 다른 사람을 만드는 일이라 다시 뽑아야 한다.
 *   — docs/기획서.md §2
 */
import { preflight, ok, fail } from "../_shared/http.ts";
import { adminClient, callerId, charge, refund } from "../_shared/supabase.ts";
import { falConfig, submit, webhookUrl, characterInput } from "../_shared/fal.ts";
import {
  loadOptions,
  editInstruction,
  TRAIT_KINDS,
  type Traits,
} from "../_shared/prompt.ts";

const COST = 1;
const ONE_HOUR = 60 * 60;

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;

  const userId = await callerId(req);
  if (!userId) return fail(req, 401, "SESSION_EXPIRED");

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return fail(req, 400, "NO_CHANGES");
  }

  const characterId = typeof body.character_id === "string" ? body.character_id : "";
  if (!characterId) return fail(req, 400, "CHARACTER_NOT_FOUND");

  const rawTraits = (body.traits ?? {}) as Record<string, unknown>;
  const wanted: Traits = {};
  for (const kind of TRAIT_KINDS) {
    const id = rawTraits[kind];
    if (typeof id === "string" && id) wanted[kind] = id;
  }

  const admin = adminClient();

  const { data: character } = await admin
    .from("characters")
    .select("id, stage, status, traits, base_image_path")
    .eq("id", characterId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!character) return fail(req, 404, "CHARACTER_NOT_FOUND");
  if (character.status === "processing") return fail(req, 409, "CHARACTER_BUSY");
  // 고른 얼굴이 있어야 고칠 수 있다. 후보를 먼저 골라야 한다는 뜻이다.
  if (character.stage !== "refining" || !character.base_image_path) {
    return fail(req, 409, "CHARACTER_NOT_READY");
  }

  const before = (character.traits ?? {}) as Traits;
  const merged: Traits = { ...before, ...wanted };

  const options = await loadOptions(admin, Object.values(merged));
  // 갈래가 맞는 값인지 본다. 화면이 먼저 막지만 서버는 그걸 믿지 않는다.
  for (const kind of TRAIT_KINDS) {
    const id = merged[kind];
    if (!id) continue;
    const option = options.get(id);
    if (!option || option.kind !== kind) return fail(req, 400, "NO_CHANGES");
  }

  const instruction = editInstruction(before, merged, options);
  if (!instruction) return fail(req, 400, "NO_CHANGES");

  const fal = falConfig("character_edit");
  if (!fal) {
    console.error("FAL_KEY 또는 FAL_CHARACTER_EDIT_MODEL이 없습니다");
    return fail(req, 503, "UPSTREAM_ERROR");
  }

  const { data: last } = await admin
    .from("character_images")
    .select("round")
    .eq("character_id", characterId)
    .eq("kind", "refined")
    .order("round", { ascending: false })
    .limit(1)
    .maybeSingle();
  const round = (last?.round ?? 0) + 1;

  const imageId = crypto.randomUUID();
  const memo = `character:${characterId}`;

  const balance = await charge(admin, userId, COST, "character_edit_charge", memo);
  if (balance === null) return fail(req, 402, "INSUFFICIENT_CREDITS");

  // 노린 속성은 이 행에 적어 둔다. 성공했을 때만 캐릭터로 옮겨진다
  // (finish_character_batch). 실패한 수정의 속성이 캐릭터에 남으면
  // 화면이 있지도 않은 머리 모양을 말하게 된다.
  const { error: rowError } = await admin.from("character_images").insert({
    id: imageId,
    character_id: characterId,
    kind: "refined",
    round,
    traits: merged,
    source_image_path: character.base_image_path,
    status: "queued",
  });
  if (rowError) {
    console.error("character_images INSERT 실패", rowError);
    await refund(admin, userId, COST, "character_edit_refund", memo);
    return fail(req, 500, "UPSTREAM_ERROR");
  }

  await admin
    .from("characters")
    .update({
      status: "processing",
      error_code: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", characterId);

  try {
    // 버킷이 private이라 fal이 경로로는 못 읽는다. 서명 URL을 만들어 넘긴다.
    const { data: signed, error: signError } = await admin.storage
      .from("characters")
      .createSignedUrl(character.base_image_path, ONE_HOUR);
    if (signError || !signed?.signedUrl) {
      throw signError ?? new Error("서명 URL 생성 실패");
    }

    await submit(
      fal,
      characterInput("character_edit", {
        prompt: instruction,
        imageUrl: signed.signedUrl,
      }),
      await webhookUrl("character_image", imageId),
    );
  } catch (e) {
    console.error("fal 큐 등록 실패", e);
    await admin
      .from("character_images")
      .update({ status: "failed", error_code: "UPSTREAM_ERROR" })
      .eq("id", imageId);
    // 고치던 얼굴은 그대로 둔다. 실패한 건 이번 수정뿐이다.
    await admin
      .from("characters")
      .update({ status: "failed", error_code: "UPSTREAM_ERROR" })
      .eq("id", characterId);
    await refund(admin, userId, COST, "character_edit_refund", memo);
    return fail(req, 502, "UPSTREAM_ERROR");
  }

  return ok(req, { image_id: imageId });
});
