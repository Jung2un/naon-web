/**
 * draft-character — 톤과 속성으로 후보 4장을 뽑는다. 캐릭터 만들기의 1단계다.
 *
 * 화면 계약 (`src/components/app/CharacterDraftForm.tsx` · `CharacterStudio.tsx`)
 *   body     { tone_id, traits, character_id? }
 *            이름은 받지 않는다(받으면 쓴다). 이름은 3단계 뒤 build-character에서 정한다
 *   응답     { character_id }
 *   비용     1크레딧 · 원장 사유 character_draft_charge
 *
 * `character_id`가 실려 오면 **다시 뽑기**다. 새 행을 만들지 않고 같은 캐릭터의 회차만 올린다.
 * 그래야 버린 후보가 목록에 캐릭터로 쌓이지 않는다.
 *
 * 순서는 기존 함수들과 같다. 실패했을 때 크레딧이 남아 있으면 안 되고,
 * 성공하지 않았는데 깎여 있어도 안 된다.
 *   1. 누구인지 · 입력이 온전한지    — 여기서 막히면 아무것도 안 깎는다
 *   2. 모델 설정이 있는지             — 키를 넣기 전에 깎지 않는다
 *   3. 차감
 *   4. characters + character_images  — 실패하면 환불
 *   5. 배경 작업 시작 후 바로 응답    — 그림이 실패하면 배치가 닫히며 환불한다
 */
import { preflight, ok, fail } from "../_shared/http.ts";
import { adminClient, callerId, charge, refund } from "../_shared/supabase.ts";
import { geminiConfig } from "../_shared/gemini.ts";
import { inBackground, runImageBatch } from "../_shared/batch.ts";
import {
  loadOptions,
  validateTraits,
  draftPrompt,
  TRAIT_KINDS,
  type Traits,
} from "../_shared/prompt.ts";

const COST = 1;
/** 4칸 그리드 한 판. 화면(`후보 그리드`)과 같은 수여야 자리가 안 흔들린다. */
const CANDIDATES = 4;

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;

  const userId = await callerId(req);
  if (!userId) return fail(req, 401, "SESSION_EXPIRED");

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return fail(req, 400, "TRAITS_INCOMPLETE");
  }

  const toneId = typeof body.tone_id === "string" ? body.tone_id : "";
  if (!toneId) return fail(req, 400, "TRAITS_INCOMPLETE");

  // 받은 것 중 우리가 아는 갈래만 추린다. 모르는 키는 조용히 버린다.
  const rawTraits = (body.traits ?? {}) as Record<string, unknown>;
  const traits: Traits = {};
  for (const kind of TRAIT_KINDS) {
    const id = rawTraits[kind];
    if (typeof id === "string" && id) traits[kind] = id;
  }

  const admin = adminClient();

  const options = await loadOptions(admin, [toneId, ...Object.values(traits)]);
  const tone = options.get(toneId);
  if (!tone || tone.kind !== "tone") return fail(req, 400, "TRAITS_INCOMPLETE");
  if (!validateTraits(traits, options)) return fail(req, 400, "TRAITS_INCOMPLETE");

  // 다시 뽑기인지 새 캐릭터인지.
  const existingId = typeof body.character_id === "string" ? body.character_id : "";
  let character: { id: string; name: string } | null = null;
  let round = 1;

  if (existingId) {
    const { data } = await admin
      .from("characters")
      .select("id, name, stage, status")
      .eq("id", existingId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!data) return fail(req, 404, "CHARACTER_NOT_FOUND");
    if (data.status === "processing") return fail(req, 409, "CHARACTER_BUSY");
    // 이미 완성된 캐릭터는 다시 뽑지 않는다. 새로 만들면 된다.
    if (data.stage !== "draft" && data.stage !== "refining") {
      return fail(req, 409, "CHARACTER_NOT_FOUND");
    }
    character = { id: data.id, name: data.name };

    const { data: last } = await admin
      .from("character_images")
      .select("round")
      .eq("character_id", existingId)
      .eq("kind", "candidate")
      .order("round", { ascending: false })
      .limit(1)
      .maybeSingle();
    round = (last?.round ?? 0) + 1;
  }

  const rawName = typeof body.name === "string" ? body.name.trim() : "";
  // DB의 name이 필수라 임시 이름을 넣어 둔다. 화면(models.ts)의 PLACEHOLDER_CHARACTER_NAME과 같은 값
  const name = rawName || character?.name || "새 캐릭터";
  if (name.length > 20) return fail(req, 400, "NAME_REQUIRED");

  // 키가 없으면 깎기 전에 멈춘다. — README A
  const gemini = geminiConfig();
  if (!gemini) {
    console.error("GEMINI_API_KEY 또는 GEMINI_IMAGE_MODEL이 없습니다");
    return fail(req, 503, "UPSTREAM_ERROR");
  }

  const characterId = character?.id ?? crypto.randomUUID();
  const memo = `character:${characterId}`;

  const balance = await charge(admin, userId, COST, "character_draft_charge", memo);
  if (balance === null) return fail(req, 402, "INSUFFICIENT_CREDITS");

  if (character) {
    const { error } = await admin
      .from("characters")
      .update({
        name,
        tone_id: toneId,
        traits,
        stage: "draft",
        status: "processing",
        error_code: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", characterId)
      .eq("user_id", userId);
    if (error) {
      console.error("characters UPDATE 실패", error);
      await refund(admin, userId, COST, "character_draft_refund", memo);
      return fail(req, 500, "UPSTREAM_ERROR");
    }
  } else {
    const { error } = await admin.from("characters").insert({
      id: characterId,
      user_id: userId,
      name,
      tone_id: toneId,
      traits,
      stage: "draft",
      status: "processing",
    });
    if (error) {
      console.error("characters INSERT 실패", error);
      await refund(admin, userId, COST, "character_draft_refund", memo);
      return fail(req, 500, "UPSTREAM_ERROR");
    }
  }

  // 행을 먼저 만든다. 배경 작업이 결과를 꽂을 자리이자, 화면이 스켈레톤을 세우는 자리다.
  const rows = Array.from({ length: CANDIDATES }, () => ({
    id: crypto.randomUUID(),
    character_id: characterId,
    kind: "candidate",
    round,
    traits,
    status: "queued",
  }));

  const { error: rowsError } = await admin.from("character_images").insert(rows);
  if (rowsError) {
    console.error("character_images INSERT 실패", rowsError);
    await admin
      .from("characters")
      .update({ status: "failed", error_code: "UPSTREAM_ERROR" })
      .eq("id", characterId);
    await refund(admin, userId, COST, "character_draft_refund", memo);
    return fail(req, 500, "UPSTREAM_ERROR");
  }

  // 그림은 배경에서 채운다. 사람을 30초~2분 기다리게 하지 않는다 — 화면은 Realtime으로 본다.
  const prompt = draftPrompt(tone, traits, options);
  inBackground(
    runImageBatch(admin, gemini, {
      userId,
      characterId,
      kind: "candidate",
      round,
      rows: rows.map((row) => ({ id: row.id, prompt })),
    }),
  );

  return ok(req, { character_id: characterId });
});
