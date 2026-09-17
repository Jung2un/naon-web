/**
 * 톤·속성을 모델에 넘길 문장으로 조립한다. — docs/기획서.md §3
 *
 * **문장 조각은 코드에 없다.** `character_options.prompt`에 있다.
 * 결과가 마음에 안 들면 DB만 고치면 되고 배포가 필요 없다.
 * 여기 있는 건 조각을 잇는 규칙뿐이다.
 *
 * 세 함수(draft · refine · build)가 전부 이 파일을 쓴다. 문장이 서로 다른 모양이 되면
 * 1단계에서 뽑은 얼굴과 3단계에서 고친 얼굴이 다른 사람이 된다.
 */
import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";

export type OptionKind =
  | "tone"
  | "gender"
  | "age"
  | "hair"
  | "hair_color"
  | "body"
  | "vibe";

export type Option = {
  id: string;
  kind: OptionKind;
  name: string;
  prompt: string;
  /** 성별에 매인 옵션만 값이 있다(성별별 머리). null이면 성별 공통 */
  gender_id?: string | null;
};

/** 속성은 `{ 갈래: 옵션 id }`로 오간다. */
export type Traits = Partial<Record<OptionKind, string>>;

/** 톤을 뺀 나머지. 화면 순서이자 문장 순서다. */
export const TRAIT_KINDS: OptionKind[] = [
  "gender",
  "age",
  "hair",
  "hair_color",
  "body",
  "vibe",
];

/** 이 둘이 없으면 사람이 안 정해진다. */
export const REQUIRED_TRAITS: OptionKind[] = ["gender", "age"];

/**
 * 다듬기에서 바꿀 수 있는 것.
 * 성별·나이대·톤은 편집으로 못 바꾼다 — 그건 다른 사람을 만드는 일이라 다시 뽑아야 한다.
 */
export const REFINABLE_TRAITS: OptionKind[] = [
  "hair",
  "hair_color",
  "body",
  "vibe",
];

/**
 * 성별에 매인 옵션(성별별 머리)이 이 성별에 맞는지. gender_id가 없으면 성별 공통이다.
 * 화면은 고른 성별의 머리만 보여주지만, 남성으로 바꾸고 여성 머리를 보낼 수 있으니 서버가 다시 본다.
 * — 마이그레이션 20260917000010, 화면 쪽은 src/types/models.ts의 matchesGender
 */
export function matchesGender(option: Option, genderId: string | undefined): boolean {
  return !option.gender_id || option.gender_id === genderId;
}

/** 고른 id들을 한 번에 읽어 확인한다. 활성 옵션이 아니면 맵에 없다. */
export async function loadOptions(
  admin: SupabaseClient,
  ids: string[],
): Promise<Map<string, Option>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return new Map();

  const { data, error } = await admin
    .from("character_options")
    .select("id, kind, name, prompt, gender_id")
    .in("id", unique)
    .eq("is_active", true);
  if (error) throw error;

  return new Map((data ?? []).map((o) => [o.id as string, o as Option]));
}

/**
 * 받은 속성이 전부 그 갈래의 활성 옵션인지 본다.
 * 화면이 먼저 막지만 서버는 그걸 믿지 않는다 — create-look이 프리셋 슬롯을 다시 보는 것과 같다.
 */
export function validateTraits(
  traits: Traits,
  options: Map<string, Option>,
): boolean {
  for (const kind of TRAIT_KINDS) {
    const id = traits[kind];
    if (id === undefined) continue;
    const option = options.get(id);
    if (!option || option.kind !== kind) return false;
    if (!matchesGender(option, traits.gender)) return false;
  }
  return REQUIRED_TRAITS.every((kind) => Boolean(traits[kind]));
}

/** 1단계 — 없는 사람 하나를 만든다. */
export function draftPrompt(
  tone: Option,
  traits: Traits,
  options: Map<string, Option>,
): string {
  const parts = TRAIT_KINDS.map((kind) => {
    const id = traits[kind];
    return id ? options.get(id)?.prompt : undefined;
  }).filter(Boolean);

  return [
    tone.prompt,
    parts.join(", "),
    "upper body, facing the camera, plain neutral background",
    "one person only, no text, no watermark",
  ].join(". ");
}

/** 갈래마다 지시문이 다르다. "머리를 단발로"와 "체형을 마른으로"는 같은 문장이 아니다. */
const CHANGE_PHRASE: Record<string, (p: string) => string> = {
  hair: (p) => `change the hairstyle to ${p}`,
  hair_color: (p) => `change the hair color to ${p}`,
  body: (p) => `change the body type to ${p}`,
  vibe: (p) => `change the expression to ${p}`,
};

/**
 * 3단계 — **바뀐 것만** 지시문으로 만든다.
 * 전체 설명을 다시 넘기면 편집 모델이 얼굴까지 새로 그린다.
 * 바꾼 게 없으면 null — 호출부가 NO_CHANGES로 돌려준다.
 */
export function editInstruction(
  before: Traits,
  after: Traits,
  options: Map<string, Option>,
): string | null {
  const changes: string[] = [];

  for (const kind of REFINABLE_TRAITS) {
    const next = after[kind];
    if (!next || next === before[kind]) continue;
    const option = options.get(next);
    if (!option) continue;
    changes.push(CHANGE_PHRASE[kind](option.prompt));
  }

  if (changes.length === 0) return null;

  return [
    changes.join(", "),
    "keep the same person, the same face and identity, the same lighting and framing",
  ].join(". ");
}

/**
 * 4단계 — 같은 사람을 다른 각도에서.
 * 좌/우가 모델마다 뒤집히면 여기 문구로 잡는다. — 기획서 §10
 */
const ANGLE_PHRASE: Record<string, string> = {
  front: "a front view, facing the camera directly",
  left45: "a three-quarter view, the person turned 45 degrees to the left",
  right45: "a three-quarter view, the person turned 45 degrees to the right",
};

export function viewInstruction(angle: string): string {
  return [
    ANGLE_PHRASE[angle] ?? ANGLE_PHRASE.front,
    "keep the same person, the same face, hairstyle, clothing and lighting",
    "plain neutral background, upper body",
  ].join(". ");
}

/**
 * 룩 — 사람은 그대로 두고 스타일만 바꾼다.
 *
 * 프리셋마다 영어 조각(`presets.prompt`)을 싣는다. 캐릭터 옵션과 같은 방식이다.
 * 조각이 비어 있는 행은 한글 이름으로 되돌아간다 — 새 프리셋을 넣고 조각을 깜빡해도 깨지지 않는다.
 * 결과를 다듬을 때는 배포 없이 그 열만 고친다. — 마이그레이션 20260917000008
 */
export function presetPhrase(preset: { name: string; prompt?: string | null }): string {
  return preset.prompt?.trim() || `"${preset.name}"`;
}

export function lookInstruction(phrases: {
  /** 전신 코디 한 벌 */
  outfit: string;
  scene: string;
  /** 없으면 캐릭터의 머리를 그대로 둔다 — 머리는 캐릭터를 만들 때 정했다 */
  hair?: string;
}): string {
  return [
    phrases.hair
      ? `change this person's hairstyle to ${phrases.hair}`
      : "keep this person's hairstyle exactly as it is",
    `dress this person in this full outfit: ${phrases.outfit}`,
    `place them in ${phrases.scene}`,
    "full body visible from head to shoes",
    "keep the same person, the same face and identity",
    "natural lighting, one person only",
  ].join(". ");
}
