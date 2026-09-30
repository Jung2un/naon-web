/** 화면에서 쓰는 타입은 전부 생성된 `database.ts`에서 파생시킨다. */
import type { Database } from "./database";

type Tables = Database["public"]["Tables"];
type Enums = Database["public"]["Enums"];

export type JobStatus = Enums["job_status"];
export type RefAngle = Enums["ref_angle"];
export type PresetSlot = Enums["preset_slot"];
export type LedgerReason = Enums["ledger_reason"];
export type CharacterStage = Enums["character_stage"];
export type CharacterImageKind = Enums["character_image_kind"];
export type OptionKind = Enums["character_option_kind"];

export type Profile = Tables["profiles"]["Row"];
export type Character = Tables["characters"]["Row"];
export type CharacterRef = Tables["character_refs"]["Row"];
export type CharacterOption = Tables["character_options"]["Row"];
export type CharacterImage = Tables["character_images"]["Row"];
export type Preset = Tables["presets"]["Row"];
export type Look = Tables["looks"]["Row"];
export type Job = Tables["jobs"]["Row"];
export type LedgerEntry = Tables["credit_ledger"]["Row"];

/** private 버킷 경로 대신 서버가 만든 signed URL을 붙여 내려주는 형태 */
export type WithSignedUrl<T, K extends string> = T & Record<K, string | null>;

export type CharacterListItem = Character & {
  thumbnail_url: string | null;
  look_count: number;
  job_count: number;
};

export type CharacterDetail = Character & {
  thumbnail_url: string | null;
  refs: Array<CharacterRef & { image_url: string | null }>;
  /** 톤과 속성을 사람이 읽는 이름으로. id는 화면에 내보내지 않는다 */
  option_names: Partial<Record<OptionKind, string>>;
  looks: LookListItem[];
  recent_jobs: JobListItem[];
};

export type CharacterOptionWithUrl = CharacterOption & {
  thumbnail_url: string | null;
  /**
   * 톤만 쓴다. 성별 옵션 id → 그 성별로 찍은 톤 사진. 없거나 null이면 thumbnail_url을 쓴다.
   * 캐릭터 만들기에서 성별을 바꾸면 톤 타일이 이 사진으로 갈아끼워진다. — src/lib/catalog.ts
   */
  thumbnail_variants?: Record<string, string | null>;
};

export type CharacterImageWithUrl = CharacterImage & {
  image_url: string | null;
};

/** 캐릭터 스튜디오(2~4단계)가 한 번에 읽는 것 */
export type CharacterBuild = Character & {
  base_image_url: string | null;
  images: CharacterImageWithUrl[];
  options: Record<OptionKind, CharacterOptionWithUrl[]>;
};

/**
 * 속성은 `{ 갈래: 옵션 id }`로 오간다. DB에서는 jsonb다.
 * Edge Function의 `_shared/prompt.ts`와 같은 모양이어야 한다.
 */
export type Traits = Partial<Record<OptionKind, string>>;

/** `characters.traits`(Json)를 화면에서 쓰는 모양으로. 이상한 값은 버린다. */
export function asTraits(value: unknown): Traits {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Traits = {};
  for (const kind of TRAIT_KINDS) {
    const id = (value as Record<string, unknown>)[kind];
    if (typeof id === "string" && id) out[kind] = id;
  }
  return out;
}

export type LookListItem = Look & {
  thumbnail_url: string | null;
  character_name: string;
  preset_names: Record<PresetSlot, string>;
};

export type JobListItem = Job & {
  thumbnail_is_fallback?: boolean;
  character_deleted?: boolean;
  thumbnail_url: string | null;
  character_name: string;
  look_name: string | null;
};

export type JobDetail = JobListItem & {
  result_video_url: string | null;
  source_video_url: string | null;
};

export type PresetWithUrl = Preset & { thumbnail_url: string | null };

/** 룩 만들기에서 4슬롯을 고르는 중간 상태 */
export type SlotSelection = Partial<Record<PresetSlot, string>>;

export const PRESET_SLOTS: readonly PresetSlot[] = [
  "hair",
  "top",
  "bottom",
  "scene",
] as const;

export const SLOT_LABEL: Record<PresetSlot, string> = {
  hair: "머리",
  top: "상의",
  bottom: "하의",
  scene: "장소",
  outfit: "코디",
};

/** 코디 탭 순서. presets.category 값과 같다 */
export const OUTFIT_CATEGORIES = ["데일리", "무대", "아우터"] as const;

/**
 * 성별을 바꾼다. 새 성별에 안 맞는 선택(다른 성별의 머리 등)은 같이 풀린다 —
 * 남성으로 바꿨는데 여성 머리가 골라진 채 남아 있으면 서버가 거절한다.
 */
export function setGender(
  traits: Traits,
  genderId: string,
  options: Record<OptionKind, { id: string; gender_id?: string | null }[]>,
): Traits {
  const next: Traits = { ...traits, gender: genderId };
  for (const kind of Object.keys(next) as OptionKind[]) {
    if (kind === "gender") continue;
    const option = options[kind]?.find((o) => o.id === next[kind]);
    if (option && !matchesGender(option, genderId)) delete next[kind];
  }
  return next;
}

/** 옵션이 이 성별에 쓸 수 있는지. gender_id가 없으면 성별 공통이다 */
export function matchesGender(
  option: { gender_id?: string | null },
  genderId: string | undefined,
): boolean {
  return !option.gender_id || option.gender_id === genderId;
}

export const ANGLE_LABEL: Record<RefAngle, string> = {
  front: "정면",
  left45: "좌 45°",
  right45: "우 45°",
  left90: "좌 90°",
  right90: "우 90°",
};

/**
 * 완성된 캐릭터는 3방향이다. 순서가 화면 순서다. — docs/기획서.md §9
 * enum의 `left90`·`right90`은 안 쓰지만 지우지 않았다(마이그레이션은 추가만 한다).
 */
export const REF_ANGLES: readonly RefAngle[] = [
  "left45",
  "front",
  "right45",
] as const;

/** 톤을 뺀 나머지. 화면 순서이자 프롬프트 순서다. — `_shared/prompt.ts`와 같아야 한다 */
export const TRAIT_KINDS: readonly OptionKind[] = [
  "gender",
  "age",
  "face",
  "hair",
  "hair_color",
  "body",
  "vibe",
  "makeup",
] as const;

/**
 * 화면에서 속성을 보여주는 순서 — 성별 → 얼굴상 → (톤) → 머리 → 나이대 → 머리색 → 체형 → 분위기.
 * 얼굴상은 성별에 매여 있어 성별 바로 다음, 머리는 사진이라 톤 바로 다음에 둔다.
 * 프롬프트 문장 순서(TRAIT_KINDS)와는 별개다.
 */
export const TRAIT_DISPLAY_KINDS: readonly OptionKind[] = [
  "gender",
  "face",
  "hair",
  "hair_color",
  "age",
  "body",
  "vibe",
  "makeup",
] as const;

/** 이 둘이 없으면 사람이 안 정해진다. 나머지는 비워도 모델이 알아서 채운다 */
export const REQUIRED_TRAIT_KINDS: readonly OptionKind[] = ["gender", "age"];

/**
 * 다듬기에서 바꿀 수 있는 것. 성별·나이대·얼굴상·톤은 편집으로 못 바꾼다 —
 * 그건 다른 사람을 만드는 일이라 다시 뽑아야 한다. — 기획서 §2
 *
 * 머리 **모양**도 여기 없다(09-29). 머리색은 마스크 안에서 바로 물들여 볼 수 있지만 모양은 생성이라
 * 미리 못 보여준다. 미리 안 보이는 칩을 이 자리에 두면 "왜 이건 바로 안 바뀌지"가 된다.
 * 모양은 1단계와 "후보부터 다시 뽑기"에서 사진을 보고 고른다. 서버(refine-character)는 여전히 받는다.
 */
export const REFINABLE_TRAIT_KINDS: readonly OptionKind[] = [
  "hair_color",
  "body",
  "vibe",
  "makeup",
];

/**
 * 얼굴 세부 조정 — 다듬기의 슬라이더. — 기획서 §3
 *
 * 칩으로 못 정하는 것(눈꼬리 각도, 콧대 높이, 눈썹 높이, 머리색 강도)을 -100 ~ +100 연속값으로 고친다.
 * 숫자는 화면에 안 보인다 — 양 끝 라벨과 미리보기가 값의 전부다.
 * 자유 프롬프트가 아니다. 키·범위는 `_shared/prompt.ts`의 ADJUSTMENT_KEYS와 같아야 한다.
 * 문장은 서버가 만든다 — 화면은 정수만 보낸다.
 */
export const ADJUSTMENT_KEYS = [
  "hair_color_depth",
  "brow_depth",
  "brow_thickness",
  "brow_match_hair",
  "makeup_liner",
  "makeup_mascara",
  "makeup_lip",
  "makeup_blush",
  "eye_tilt",
  "eye_height",
  "eye_scale_x",
  "eye_scale_y",
  "nose_height",
  "nose_tilt",
  "nose_width",
  "midface",
  "brow_tilt",
  "brow_height",
  "jaw_vline",
  "chin_length",
] as const;
export type AdjustmentKey = (typeof ADJUSTMENT_KEYS)[number];
export type Adjustments = Partial<Record<AdjustmentKey, number>>;
export const ADJUSTMENT_RANGE = 100;

/**
 * 화면에 나오는 순서와 문구. `low`·`high`는 슬라이더 양 끝 라벨이다.
 * `max`가 있으면 그 위로는 못 간다 — 메이크업은 지금 것이 기준이고 연하게만 간다(더 진하게는 안 만든다).
 * `toggle`이면 체크박스다. 값은 0(끔) 또는 100(켬)이다.
 */
export type AdjustmentItem = {
  key: AdjustmentKey;
  label: string;
  low: string;
  high: string;
  max?: number;
  /** 저장값의 양수가 축소 방향인 항목은 화면에서만 부호를 뒤집는다. */
  reversed?: boolean;
  toggle?: boolean;
};
export const ADJUSTMENT_GROUPS: ReadonlyArray<{ title: string; items: ReadonlyArray<AdjustmentItem> }> = [
  { title: "머리색", items: [{ key: "hair_color_depth", label: "강도", low: "연하게", high: "진하게" }] },
  {
    title: "눈썹",
    items: [
      { key: "brow_tilt", label: "각도", low: "처지게", high: "올라가게" },
      { key: "brow_height", label: "높낮이", low: "낮게", high: "높게" },
      { key: "brow_depth", label: "색 진하기", low: "연하게", high: "진하게" },
      { key: "brow_thickness", label: "두께", low: "얇게", high: "두껍게" },
      { key: "brow_match_hair", label: "머리색과 맞추기", low: "", high: "", toggle: true },
    ],
  },
  {
    title: "눈",
    items: [
      { key: "eye_tilt", label: "눈꼬리 각도", low: "내려가게", high: "올라가게" },
      { key: "eye_height", label: "높낮이", low: "낮게", high: "높게" },
      { key: "eye_scale_x", label: "가로 크기", low: "좁게", high: "넓게" },
      { key: "eye_scale_y", label: "세로 크기", low: "작게", high: "크게" },
    ],
  },
  {
    title: "코",
    items: [
      { key: "nose_height", label: "콧대 높이", low: "낮게", high: "높게" },
      { key: "nose_tilt", label: "코끝 각도", low: "내려가게", high: "올라가게" },
      { key: "nose_width", label: "콧볼", low: "좁게", high: "넓게", reversed: true },
    ],
  },
  {
    title: "중안부",
    items: [{ key: "midface", label: "길이 (눈~입)", low: "짧게", high: "길게" }],
  },
  {
    title: "턱 라인",
    items: [
      { key: "jaw_vline", label: "V라인", low: "갸름하게", high: "둥글게", reversed: true },
      { key: "chin_length", label: "턱 길이", low: "짧게", high: "길게" },
    ],
  },
  {
    title: "메이크업",
    items: [
      { key: "makeup_liner", label: "아이라인 · 섀도", low: "연하게", high: "지금처럼", max: 0 },
      { key: "makeup_mascara", label: "속눈썹 (마스카라)", low: "연하게", high: "지금처럼", max: 0 },
      { key: "makeup_lip", label: "입술", low: "연하게", high: "지금처럼", max: 0 },
      { key: "makeup_blush", label: "블러셔", low: "연하게", high: "지금처럼", max: 0 },
    ],
  },
];

/** `characters.adjustments`(Json)를 화면에서 쓰는 모양으로. 범위 밖·0·모르는 키는 버린다. */
export function asAdjustments(value: unknown): Adjustments {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Adjustments = {};
  for (const key of ADJUSTMENT_KEYS) {
    const raw = (value as Record<string, unknown>)[key];
    if (typeof raw !== "number" || !Number.isInteger(raw) || raw === 0) continue;
    if (Math.abs(raw) > ADJUSTMENT_RANGE) continue;
    // 메이크업은 연하게만. 지금 것보다 진하게는 안 만든다 — IDENTITY_LOCK과 같은 방향
    if (key.startsWith("makeup_") && raw > 0) continue;
    // 켬/끔 스위치. 0이면 이미 위에서 버려졌으니 켜진 것만 100으로 맞춘다
    if (key === "brow_match_hair") { out[key] = ADJUSTMENT_RANGE; continue; }
    out[key] = raw;
  }
  return out;
}

export function sameAdjustments(a: Adjustments, b: Adjustments): boolean {
  return ADJUSTMENT_KEYS.every((key) => (a[key] ?? 0) === (b[key] ?? 0));
}

export const OPTION_KIND_LABEL: Record<OptionKind, string> = {
  tone: "톤",
  gender: "성별",
  age: "나이대",
  hair: "머리",
  hair_color: "머리색",
  body: "체형",
  vibe: "분위기",
  face: "얼굴상",
  makeup: "메이크업",
};

/** 캐릭터가 어디까지 왔나. status(지금 걸린 생성)와는 다른 질문이다. — 기획서 §5 */
export const STAGE_LABEL: Record<CharacterStage, string> = {
  draft: "후보 고르는 중",
  refining: "다듬는 중",
  building: "3방향 뽑는 중",
  ready: "완성",
};

/** 캐릭터 만들기의 단계별 크레딧. 함수도 같은 값을 쓴다. — 기획서 §4 */
export const CHARACTER_COST = { draft: 1, refine: 1, build: 2 } as const;

/**
 * 1단계에서는 이름을 안 받는다. DB의 name이 필수라 후보를 뽑을 때 이 값이 들어가고,
 * 3단계에서 완성할 때 사용자가 적은 이름으로 바뀐다. — draft-character · build-character와 같은 값
 */
export const PLACEHOLDER_CHARACTER_NAME = "새 캐릭터";

/** Stepper 네 단계. 1단계는 `/characters/new`, 나머지는 스튜디오다. */
export const CHARACTER_STEPS = ["톤 고르기", "후보 고르기", "다듬기", "완성"];

export const STAGE_STEP: Record<CharacterStage, number> = {
  draft: 1,
  refining: 2,
  building: 3,
  ready: 3,
};

/**
 * 이 아래로 떨어지면 "곧 막힌다"고 본다. 크레딧 카드의 충전 버튼이 Primary로 승격되고,
 * 모바일 상단 앱바에도 충전 칩이 뜬다. 두 자리가 같은 숫자를 봐야 해서 여기 둔다.
 */
export const LOW_CREDIT_BALANCE = 3;

export const STATUS_LABEL: Record<JobStatus, string> = {
  queued: "대기",
  processing: "처리 중",
  done: "완료",
  failed: "실패",
};

export const LEDGER_REASON_LABEL: Record<LedgerReason, string> = {
  signup_bonus: "가입 보너스",
  job_charge: "영상 변환",
  job_refund: "변환 실패 환불",
  character_draft_charge: "캐릭터 후보 뽑기",
  character_draft_refund: "후보 실패 환불",
  character_edit_charge: "캐릭터 다듬기",
  character_edit_refund: "다듬기 실패 환불",
  character_charge: "캐릭터 완성",
  character_refund: "완성 실패 환불",
  look_charge: "룩 만들기",
  look_refund: "룩 실패 환불",
  purchase: "크레딧 충전",
  adjustment: "조정",
};
