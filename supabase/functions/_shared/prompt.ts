/**
 * 톤·속성을 모델에 넘길 문장으로 조립한다. — docs/기획서.md §3
 *
 * 톤별 조명·배경과 선택 속성의 문장은 `character_options.prompt`에 있다.
 * 톤 표현은 DB에서 조정한다. 공통 캐스팅·구도·선택 우선순위는 여기서 조립한다.
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

/**
 * 사진 계열 톤. 이 톤에만 카메라·피부 질감·색 보정 같은 사진 지시를 붙인다.
 * 애니·3D나 나중에 추가하는 그림 톤은 여기 없어야 사진 어휘가 섞이지 않는다.
 * id는 마이그레이션 20260916000007 시드에 고정돼 있다.
 */
const PHOTOGRAPHIC_TONE_IDS = new Set([
  "a1111111-0000-4000-8000-000000000001", // 실사
  "a1111111-0000-4000-8000-000000000002", // 시네마틱
  "a1111111-0000-4000-8000-000000000003", // 화보
  "a1111111-0000-4000-8000-000000000004", // 일상 스냅
]);

export function isPhotographicTone(tone: Pick<Option, "id">): boolean {
  return PHOTOGRAPHIC_TONE_IDS.has(tone.id);
}

const AGE_TWENTIES_IDS = new Set([
  "a3333333-0000-4000-8000-000000000001",
  "a3333333-0000-4000-8000-000000000002",
]);

/**
 * 성별별 연출. 같은 "사진처럼"이라도 여성·남성·중성은 피부·메이크업·스타일링 지시가 달라야 한다.
 * `features`는 매체를 가리지 않고, `skin`은 사진 계열 톤에만 붙는다.
 * "예쁜·완벽한" 같은 형용사는 쓰지 않는다 — 그 말이 AI 티 나는 '너무 완벽한 얼굴'을 만든다.
 * id는 마이그레이션 20260916000007 시드의 gender 행이다.
 */
type Presentation = { features: string; skin: string };
const GENDER_PRESENTATION: Record<string, Presentation> = {
  // 여성
  "a2222222-0000-4000-8000-000000000001": {
    features:
      "Natural Korean facial features with individual character; soft, subtle makeup and natural lip color; understated, elegant styling. Not an idealized beauty-filter face: no enlarged eyes, no exaggerated lips, no heavy contouring.",
    skin:
      "Clear skin with realistic texture, fine pores and natural tonal variation; no plastic or waxy smoothing.",
  },
  // 남성
  "a2222222-0000-4000-8000-000000000002": {
    features:
      "Natural Korean masculine features with individual character; neat natural brows and grooming, clean-shaven or lightly groomed as fits the age; understated menswear editorial styling. No feminizing beauty-filter smoothing, no exaggerated jawline or bodybuilder physique.",
    skin:
      "Realistic skin texture with visible pores, natural shadow along the jaw and slight unevenness; no plastic or waxy smoothing.",
  },
  // 중성적
  "a2222222-0000-4000-8000-000000000003": {
    features:
      "Deliberately androgynous presentation: balanced features that do not read as clearly feminine or masculine, minimal or no visible makeup, unisex contemporary styling. Do not fall back to a conventional feminine or masculine template.",
    skin:
      "Realistic skin texture with fine pores and natural tonal variation; no plastic or waxy smoothing.",
  },
};
const DEFAULT_PRESENTATION: Presentation = {
  features:
    "Natural Korean facial features with individual character and understated contemporary styling; not an idealized template face.",
  skin:
    "Realistic skin texture with fine pores and natural tonal variation; no plastic or waxy smoothing.",
};

/** 후보마다 얼굴 윤곽만 달리 준다. 나머지 선택은 그대로다. */
const FACE_VARIATIONS = [
  "gently oval facial proportions and softly defined features",
  "a softly tapered face and subtly defined cheekbones",
  "a softly rounded face and balanced facial proportions",
  "a softly angular face and a clearly defined jawline",
];

/**
 * 1단계 — 카탈로그 톤의 미감과 사용자 속성을 함께 지키는 새 성인 인물.
 *
 * 구조화된 JSON 텍스트로 보낸다. 고정되는 것(identity)과 바뀌는 것(scene·styling)을 나눠 두면
 * 모델이 "사람"과 "그날의 연출"을 섞지 않는다. — docs/캐릭터-생성-프롬프트.md
 *
 * 사진 계열 톤에는 natural skin texture · muted neutral palette · editorial/lifestyle photography ·
 * shallow depth of field 같은 실사 어휘를 붙이고, 애니·3D에는 붙이지 않는다.
 */
export function draftPrompt(
  tone: Option,
  traits: Traits,
  options: Map<string, Option>,
  candidateIndex = 0,
): string {
  const pick = (kind: OptionKind) => {
    const id = traits[kind];
    return id ? options.get(id)?.prompt : undefined;
  };
  const gender = pick("gender");
  const age = pick("age");
  const hair = pick("hair");
  const hairColor = pick("hair_color");
  const body = pick("body");
  const vibe = pick("vibe");

  const photographic = isPhotographicTone(tone);
  const twenties = AGE_TWENTIES_IDS.has(traits.age ?? "");
  const presentation = GENDER_PRESENTATION[traits.gender ?? ""] ??
    DEFAULT_PRESENTATION;
  const variation = FACE_VARIATIONS[
    ((Math.trunc(candidateIndex) || 0) % FACE_VARIATIONS.length +
      FACE_VARIATIONS.length) % FACE_VARIATIONS.length
  ];

  const ageDirection = twenties
    ? "Visibly a fresh, healthy adult in their twenties with rested eyes and soft facial volume; no older-looking creases, hollow cheeks or heavy under-eye shadows."
    : "Represent the selected adult age honestly with age-appropriate features and grooming; do not make an older adult look like someone in their twenties.";

  const request: Record<string, unknown> = {
    task:
      "Create one original fictional Korean adult character for a character casting catalog. A new, individual person with their own face, not a celebrity likeness and not a generic idealized template. Never depict a child or teenager. Return a single image.",
    scene: {
      description: tone.prompt,
      mood: vibe
        ? `${vibe}; understated and natural rather than posed or performed.`
        : "Understated, natural and composed rather than posed or performed.",
    },
    subject: {
      identity_fixed: {
        ethnicity: "East Asian (Korean)",
        gender: gender ?? "an adult",
        age: age ?? "an adult",
        age_direction: ageDirection,
        face: variation,
        ...(body ? { build: body } : {}),
        ...(hair || hairColor
          ? { hair: [hair, hairColor].filter(Boolean).join(", ") }
          : {}),
        priority:
          "These selected traits override any styling default. Preserve the selected gender presentation, age, hairstyle, hair color and body type exactly.",
      },
      presentation: photographic
        ? `${presentation.features} ${presentation.skin}`
        : presentation.features,
      styling: {
        wardrobe:
          "Simple contemporary clothing that fits the scene, in muted neutral tones; nothing that competes with the face.",
        expression: vibe
          ? `A natural, believable expression consistent with ${vibe}; small asymmetries and individual character kept.`
          : "A calm, natural expression; small asymmetries and individual character kept.",
      },
    },
  };

  const composition =
    "Vertical 3:4 upper-body portrait at eye level. Complete head, hair and both shoulders with comfortable headroom. Face nearly forward so both eyes and the face contour are clear; relaxed natural pose, not a rigid ID-photo pose. Face unobstructed; the setting stays simple and secondary to the person.";

  if (photographic) {
    request.camera_technical = {
      capture:
        "Photorealistic still photograph. Realistic lens rendering consistent with the described scene, shallow depth of field, natural exposure with realistic specular highlights and soft natural shadows.",
      composition,
      color:
        "Muted neutral color palette with soft, natural color grading; no oversaturation, no heavy vignette.",
      retouching:
        "Clean minor blemishes only. Preserve natural skin texture, pores and fine facial details; preserve fabric and hair micro-detail. No haloing, no cartoon smoothing, no oversharpening.",
      style:
        "Korean editorial and lifestyle photography: candid, understated, authentic; reads as a real photograph, not a render.",
    };
    request.avoid = [
      "beauty-filter or CGI look, plastic, waxy or overly smooth skin",
      "idealized, overly symmetrical template features",
      "dramatic or harsh lighting, heavy vignette, oversaturated color",
      "illustration or 3D rendering mixed into the photograph",
      "warped background geometry, oversharpening, halos",
      "text, caption, watermark, logo, border, collage or comparison grid",
      "more than one person, hands or objects covering the face",
    ];
  } else {
    request.rendering = {
      medium:
        "Follow the selected illustrated or 3D medium throughout, with consistent line, shading and color treatment. Do not mix photographic skin rendering into it.",
      composition,
    };
    request.avoid = [
      "photographic skin pores or lens artifacts inside the illustration",
      "exaggerated doll-like or idealized template proportions",
      "text, caption, watermark, logo, border, collage or comparison grid",
      "more than one person, hands or objects covering the face",
    ];
  }

  request.output =
    "One person, one complete portrait filling the frame edge to edge. Coherent anatomy and facial proportions for the selected medium.";

  return JSON.stringify(request, null, 2);
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
  /** 없으면 배경을 바꾸지 않는다 — 기본은 찍은 장소 그대로다 */
  scene?: string;
  /** 없으면 캐릭터의 머리를 그대로 둔다 — 머리는 캐릭터를 만들 때 정했다 */
  hair?: string;
}): string {
  return [
    phrases.hair
      ? `change this person's hairstyle to ${phrases.hair}`
      : "keep this person's hairstyle exactly as it is",
    `dress this person in this full outfit: ${phrases.outfit}`,
    phrases.scene
      ? `place them in ${phrases.scene}`
      : "keep the original background and location exactly as it is, only change the person's outfit",
    "full body visible from head to shoes",
    "keep the same person, the same face and identity",
    "natural lighting, one person only",
  ].join(". ");
}
