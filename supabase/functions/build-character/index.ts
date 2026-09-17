/**
 * build-character — 확정한 얼굴로 정면·좌45·우45를 뽑는다. 캐릭터 만들기의 4단계다.
 *
 * 화면 계약 (`src/components/app/CharacterStudio.tsx`)
 *   body     { character_id, name }
 *            이름은 여기서 정한다. 1단계에서는 임시 이름("새 캐릭터")이 들어가 있다
 *   응답     { character_id }
 *   비용     2크레딧 · 원장 사유 character_charge
 *
 * **3장이 다 있어야 캐릭터가 성립한다.** 두 장만 나오면 못 쓰는 캐릭터라,
 * 하나라도 실패하면 배치 전체를 실패로 보고 환불한다 (finish_character_batch).
 * 후보(4장 중 하나만 나와도 고를 수 있다)와 규칙이 다른 이유다. — docs/기획서.md §4
 */
import { preflight, ok, fail } from "../_shared/http.ts";
import { adminClient, callerId, charge, refund } from "../_shared/supabase.ts";
import { geminiConfig } from "../_shared/gemini.ts";
import { inBackground, runImageBatch } from "../_shared/batch.ts";
import { viewInstruction } from "../_shared/prompt.ts";

const COST = 2;
/** 정면·좌45·우45. 측면 90°는 얼굴 정보가 적어서 안 뽑는다. — 기획서 §9 */
const ANGLES = ["front", "left45", "right45"] as const;

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;

  const userId = await callerId(req);
  if (!userId) return fail(req, 401, "SESSION_EXPIRED");

  let body: { character_id?: unknown; name?: unknown };
  try {
    body = await req.json();
  } catch {
    return fail(req, 400, "CHARACTER_NOT_FOUND");
  }

  const characterId = typeof body.character_id === "string" ? body.character_id : "";
  if (!characterId) return fail(req, 400, "CHARACTER_NOT_FOUND");

  // 이름 없이는 완성하지 않는다. 깎기 전에 본다
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name || name.length > 20) return fail(req, 400, "NAME_REQUIRED");

  const admin = adminClient();

  const { data: character } = await admin
    .from("characters")
    .select("id, stage, status, base_image_path")
    .eq("id", characterId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!character) return fail(req, 404, "CHARACTER_NOT_FOUND");
  if (character.status === "processing") return fail(req, 409, "CHARACTER_BUSY");
  if (character.stage !== "refining" || !character.base_image_path) {
    return fail(req, 409, "CHARACTER_NOT_READY");
  }

  const gemini = geminiConfig();
  if (!gemini) {
    console.error("GEMINI_API_KEY 또는 GEMINI_IMAGE_MODEL이 없습니다");
    return fail(req, 503, "UPSTREAM_ERROR");
  }

  const { data: last } = await admin
    .from("character_images")
    .select("round")
    .eq("character_id", characterId)
    .eq("kind", "view")
    .order("round", { ascending: false })
    .limit(1)
    .maybeSingle();
  const round = (last?.round ?? 0) + 1;

  const { error: nameError } = await admin
    .from("characters")
    .update({ name })
    .eq("id", characterId);
  if (nameError) {
    console.error("이름 저장 실패", nameError);
    return fail(req, 500, "UPSTREAM_ERROR");
  }

  const memo = `character:${characterId}`;
  const balance = await charge(admin, userId, COST, "character_charge", memo);
  if (balance === null) return fail(req, 402, "INSUFFICIENT_CREDITS");

  const rows = ANGLES.map((angle) => ({
    id: crypto.randomUUID(),
    character_id: characterId,
    kind: "view",
    angle,
    round,
    source_image_path: character.base_image_path,
    status: "queued",
  }));

  const { error: rowsError } = await admin.from("character_images").insert(rows);
  if (rowsError) {
    console.error("character_images INSERT 실패", rowsError);
    await refund(admin, userId, COST, "character_refund", memo);
    return fail(req, 500, "UPSTREAM_ERROR");
  }

  await admin
    .from("characters")
    .update({
      stage: "building",
      status: "processing",
      error_code: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", characterId);

  // 세 장을 배경에서 나란히 만든다. 하나라도 실패하면 배치가 닫히며 2크레딧을 돌려준다.
  inBackground(
    runImageBatch(admin, gemini, {
      userId,
      characterId,
      kind: "view",
      round,
      rows: rows.map((row) => ({ id: row.id, prompt: viewInstruction(row.angle) })),
      sourcePath: character.base_image_path,
    }),
  );

  return ok(req, { character_id: characterId });
});
