/**
 * create-look — 크레딧 차감 + looks INSERT + 이미지 생성(Gemini)
 *
 * 화면 계약 (`src/components/app/LookBuilder.tsx`)
 *   body     { character_id, name, outfit_preset_id, scene_preset_id?, hair_preset_id? }
 *            옷은 전신 코디 한 벌이다. 머리는 캐릭터의 것을 그대로 쓴다.
 *            장소는 선택이다. 안 보내면 배경은 찍은 그대로 두고 인물만 바꾼다.
 *   응답     { look_id }
 *   비용     1크레딧 · 원장 사유 look_charge
 *
 * 그림은 응답을 보낸 뒤 배경에서 만든다. 화면은 Realtime으로 status만 본다. — 기획서 §7
 *
 * 화면이 4슬롯을 다 고르기 전에는 버튼을 막지만(SummaryBar), 서버는 그걸 믿지 않는다.
 * 프리셋 id가 실제로 그 슬롯의 활성 프리셋인지까지 확인한다 —
 * 아니면 looks의 외래키만 통과하고 엉뚱한 슬롯 조합이 들어간다.
 */
import { preflight, ok, fail } from "../_shared/http.ts";
import { adminClient, callerId, charge, refund } from "../_shared/supabase.ts";
import {
  geminiConfig,
  generateImage,
  GenerationError,
  toSourceImage,
  type GeminiConfig,
} from "../_shared/gemini.ts";
import { extensionOf, inBackground } from "../_shared/batch.ts";
import { lookInstruction, presetPhrase } from "../_shared/prompt.ts";

const COST = 1;
type Slot = "outfit" | "scene" | "hair";

/**
 * 룩은 코디 한 벌이 필수다. 장소와 머리는 보냈을 때만 본다.
 * - 장소: 기본은 찍은 배경 그대로. 자기 장소를 드러내기 싫은 사용자만 고른다
 * - 머리: 캐릭터를 만들 때 정했다. 보내면 받긴 한다(예전 화면·앱 호환)
 * 상의·하의는 더 받지 않는다.
 */
function requiredSlots(body: Record<string, unknown>): Slot[] {
  const sent = (key: string) => typeof body[key] === "string" && Boolean(body[key]);
  const slots: Slot[] = ["outfit"];
  if (sent("scene_preset_id")) slots.push("scene");
  if (sent("hair_preset_id")) slots.push("hair");
  return slots;
}

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

  const SLOTS = requiredSlots(body);
  const presetIds: Partial<Record<Slot, string>> = {};
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
    .is("deleted_at", null)
    .maybeSingle();
  if (!character) return fail(req, 404, "LOOK_INCOMPLETE");
  if (character.stage !== "ready" || character.status !== "done") {
    return fail(req, 409, "CHARACTER_NOT_READY");
  }

  // 고른 프리셋이 정말 그 슬롯의 활성 프리셋인지.
  const { data: presets } = await admin
    .from("presets")
    .select("id, slot, name, prompt")
    .in("id", Object.values(presetIds) as string[])
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

  // 키가 없으면 깎기 전에 멈춘다.
  const gemini = geminiConfig();
  if (!gemini) {
    console.error("GEMINI_API_KEY 또는 GEMINI_IMAGE_MODEL이 없습니다");
    return fail(req, 503, "AI_NOT_CONFIGURED");
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
    hair_preset_id: presetIds.hair ?? null,
    top_preset_id: null,
    bottom_preset_id: null,
    outfit_preset_id: presetIds.outfit,
    scene_preset_id: presetIds.scene ?? null,
    status: "queued",
  });
  if (insertError) {
    console.error("looks INSERT 실패", insertError);
    await refund(admin, userId, COST, "look_refund", memo);
    return fail(req, 500, "UPSTREAM_ERROR");
  }

  // 룩도 이미지 한 장이다. 캐릭터와 같은 방식으로 배경에서 만들어 꽂는다.
  inBackground(
    renderLook(admin, gemini, {
      userId,
      lookId,
      sourcePath: character.base_image_path ?? character.thumbnail_path,
      prompt: lookInstruction({
        outfit: presetPhrase(bySlot.get("outfit")!),
        ...(presetIds.scene ? { scene: presetPhrase(bySlot.get("scene")!) } : {}),
        ...(presetIds.hair ? { hair: presetPhrase(bySlot.get("hair")!) } : {}),
      }),
    }),
  );

  return ok(req, { look_id: lookId });
});

/**
 * 캐릭터의 지금 얼굴 위에 룩을 입힌다.
 *
 * 실패 처리는 조건부 전이로 한 번만 한다 — 행을 못 잡으면 이미 누가 처리한 것이라
 * 환불을 건너뛴다. 캐릭터 쪽 finish_character_batch와 같은 장치다.
 */
async function renderLook(
  admin: ReturnType<typeof adminClient>,
  gemini: GeminiConfig,
  args: {
    userId: string;
    lookId: string;
    sourcePath: string | null;
    prompt: string;
  },
): Promise<void> {
  try {
    if (!args.sourcePath) throw new Error("캐릭터 이미지가 없습니다");

    const { data: file, error: downloadError } = await admin.storage
      .from("characters")
      .download(args.sourcePath);
    if (downloadError || !file) throw downloadError ?? new Error("캐릭터 이미지를 못 읽었습니다");

    const image = await generateImage(gemini, {
      prompt: args.prompt,
      image: toSourceImage(await file.arrayBuffer(), file.type || "image/jpeg"),
    });

    const path = `${args.userId}/${args.lookId}/result.${extensionOf(image.contentType)}`;
    const { error: uploadError } = await admin.storage
      .from("looks")
      .upload(path, image.bytes, { contentType: image.contentType, upsert: true });
    if (uploadError) throw uploadError;

    const { error: doneError } = await admin
      .from("looks")
      .update({ status: "done", thumbnail_path: path, error_code: null })
      .eq("id", args.lookId)
      .in("status", ["queued", "processing"]);
    if (doneError) throw doneError;
  } catch (e) {
    const code = e instanceof GenerationError ? e.code : "UPSTREAM_ERROR";
    console.error("룩 생성 실패", { look: args.lookId, code, e });

    const { data: claimed } = await admin
      .from("looks")
      .update({ status: "failed", error_code: code })
      .eq("id", args.lookId)
      .in("status", ["queued", "processing"])
      .select("id")
      .maybeSingle();

    if (claimed) {
      await refund(admin, args.userId, COST, "look_refund", `look:${args.lookId}`);
    }
  }
}
