/**
 * create-look — 크레딧 차감 + looks INSERT + fal.ai 큐 등록
 *
 * 화면 계약 (`src/components/app/LookBuilder.tsx`)
 *   body     { character_id, name, hair_preset_id, top_preset_id, bottom_preset_id, scene_preset_id }
 *   응답     { look_id }
 *   비용     1크레딧 · 원장 사유 look_charge
 *
 * 화면이 4슬롯을 다 고르기 전에는 버튼을 막지만(SummaryBar), 서버는 그걸 믿지 않는다.
 * 프리셋 id가 실제로 그 슬롯의 활성 프리셋인지까지 확인한다 —
 * 아니면 looks의 외래키만 통과하고 엉뚱한 슬롯 조합이 들어간다.
 */
import { preflight, ok, fail } from "../_shared/http.ts";
import { adminClient, callerId, charge, refund } from "../_shared/supabase.ts";
import { falConfig, submit, webhookUrl } from "../_shared/fal.ts";

const COST = 1;
const SLOTS = ["hair", "top", "bottom", "scene"] as const;
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
    return fail(req, 400, "LOOK_INCOMPLETE");
  }

  const characterId = typeof body.character_id === "string" ? body.character_id : "";
  if (!characterId) return fail(req, 400, "LOOK_INCOMPLETE");

  const presetIds: Record<string, string> = {};
  for (const slot of SLOTS) {
    const id = body[`${slot}_preset_id`];
    if (typeof id !== "string" || !id) return fail(req, 400, "LOOK_INCOMPLETE");
    presetIds[slot] = id;
  }

  const admin = adminClient();

  // 본인 캐릭터인지, 그리고 **끝까지** 만들어진 캐릭터인지.
  // status='done'만 보면 후보가 나온 단계(stage='draft')에서도 룩이 만들어진다. — 기획서 §5
  const { data: character } = await admin
    .from("characters")
    .select("id, name, status, stage, base_image_path, thumbnail_path")
    .eq("id", characterId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!character) return fail(req, 404, "LOOK_INCOMPLETE");
  if (character.stage !== "ready" || character.status !== "done") {
    return fail(req, 409, "CHARACTER_NOT_READY");
  }

  // 고른 프리셋이 정말 그 슬롯의 활성 프리셋인지.
  const { data: presets } = await admin
    .from("presets")
    .select("id, slot, name")
    .in("id", Object.values(presetIds))
    .eq("is_active", true);

  const bySlot = new Map((presets ?? []).map((p) => [p.slot, p]));
  for (const slot of SLOTS) {
    const preset = bySlot.get(slot);
    if (!preset || preset.id !== presetIds[slot]) {
      return fail(req, 400, "LOOK_INCOMPLETE");
    }
  }

  // 이름을 안 적었으면 고른 조합으로 짓는다. 화면과 같은 규칙이다.
  const fallbackName = SLOTS.map((s) => bySlot.get(s)!.name).join(" ");
  const raw = typeof body.name === "string" ? body.name.trim() : "";
  const name = (raw || fallbackName).slice(0, 40);

  // 모델을 안 고른 상태에서는 깎기 전에 멈춘다.
  const fal = falConfig("look");
  if (!fal) {
    console.error("FAL_KEY 또는 FAL_LOOK_MODEL이 없습니다");
    return fail(req, 503, "UPSTREAM_ERROR");
  }

  const lookId = crypto.randomUUID();
  const memo = `look:${lookId}`;

  const balance = await charge(admin, userId, COST, "look_charge", memo);
  if (balance === null) return fail(req, 402, "INSUFFICIENT_CREDITS");

  const { error: insertError } = await admin.from("looks").insert({
    id: lookId,
    user_id: userId,
    character_id: characterId,
    name,
    hair_preset_id: presetIds.hair,
    top_preset_id: presetIds.top,
    bottom_preset_id: presetIds.bottom,
    scene_preset_id: presetIds.scene,
    status: "queued",
  });
  if (insertError) {
    console.error("looks INSERT 실패", insertError);
    await refund(admin, userId, COST, "look_refund", memo);
    return fail(req, 500, "UPSTREAM_ERROR");
  }

  try {
    // 캐릭터의 지금 얼굴이 룩의 입력이다. private 버킷이라 서명 URL로 넘긴다.
    const basePath = character.base_image_path ?? character.thumbnail_path;
    let characterUrl: string | null = null;
    if (basePath) {
      const { data } = await admin.storage
        .from("characters")
        .createSignedUrl(basePath, ONE_HOUR);
      characterUrl = data?.signedUrl ?? null;
    }
    if (!characterUrl) throw new Error("캐릭터 이미지가 없습니다");

    // 입력 모양은 고른 모델에 맞춰야 한다. 모델이 정해지면 여기부터 고친다. — README 4번
    await submit(
      fal,
      {
        image_url: characterUrl,
        prompt: SLOTS.map((s) => bySlot.get(s)!.name).join(", "),
      },
      await webhookUrl("look", lookId),
    );
  } catch (e) {
    console.error("fal 큐 등록 실패", e);
    await admin
      .from("looks")
      .update({ status: "failed", error_code: "UPSTREAM_ERROR" })
      .eq("id", lookId);
    await refund(admin, userId, COST, "look_refund", memo);
    return fail(req, 502, "UPSTREAM_ERROR");
  }

  return ok(req, { look_id: lookId });
});
