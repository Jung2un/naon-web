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
  | "vibe"
  | "face";

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
  "face",
  "hair",
  "hair_color",
  "body",
  "vibe",
];

/** 이 둘이 없으면 사람이 안 정해진다. */
export const REQUIRED_TRAITS: OptionKind[] = ["gender", "age"];

/**
 * 다듬기에서 바꿀 수 있는 것.
 * 성별·나이대·얼굴상·톤은 편집으로 못 바꾼다 — 그건 다른 사람을 만드는 일이라 다시 뽑아야 한다.
 * 얼굴의 세부(눈·코·눈썹의 각도와 높낮이, 머리색 강도)는 칩이 아니라 슬라이더다 — `Adjustments`.
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

/**
 * 나이대별 연출. **고른 나이대가 결과에 그대로 보여야 한다.** — 09-22 5차
 *
 * 그 전에는 "20대"와 "그 외" 두 갈래뿐이었고, 20대 초반을 고른 결과가 30대 중반으로 나왔다.
 * 나이는 형용사("젊은")로 안 정해진다. **몇 살로 읽혀야 하는지**와,
 * 그 나이에 있어야 할/없어야 할 것(팔자주름·눈밑 그늘·턱선·볼 볼륨)을 구체적으로 적어야 정해진다.
 *
 * 양쪽을 다 막는다 — 위로도 아래로도 벗어나면 안 된다. 미성년은 어느 경우에도 없다.
 * id는 마이그레이션 20260916000007 시드의 age 행이다.
 */
const AGE_DIRECTION: Record<string, string> = {
  // 20대 초반
  "a3333333-0000-4000-8000-000000000001":
    "Aged 21 to 24, and must not read a day older. Taut youthful skin, smooth softly full cheeks and a clean light jawline; no nasolabial folds, no under-eye shadows or hollows, no forehead or eye-corner lines, no heaviness or slackness anywhere in the face. Bright rested eyes and a fine soft hairline.",
  // 20대 후반
  "a3333333-0000-4000-8000-000000000002":
    "Aged 25 to 29, and must not read as thirty or older. Smooth firm skin and rested eyes, carrying a slightly more settled, composed presence than an early-twenties face; still no nasolabial folds, no under-eye hollows and no lines visible at rest.",
  // 30대
  "a3333333-0000-4000-8000-000000000003":
    "Aged 30 to 39, and must read clearly as that — neither younger nor older. Firm well-kept skin with only the faintest expression lines, a defined adult jawline and a self-assured presence. No twenties softness, and none of the heaviness of a forties face.",
  // 40대
  "a3333333-0000-4000-8000-000000000004":
    "Aged 40 to 49, and must read clearly as that. Well-kept skin with light honest expression lines at the eyes and mouth, a mature defined jawline and an assured presence. Do not smooth the age back into the thirties, and do not add elderly features.",
  // 50대 이상
  "a3333333-0000-4000-8000-000000000005":
    "Aged 50 or older, and must read clearly as that. Well-kept skin with honest lines, mature facial structure and possibly some grey at the temples; dignified and vital rather than frail. Do not render this person as a thirties or forties face.",
};
const DEFAULT_AGE_DIRECTION =
  "Represent the selected adult age honestly and precisely: the face must read as that bracket, neither younger nor older.";

/**
 * 성별별 연출. 같은 "사진처럼"이라도 여성·남성·중성은 피부·메이크업·스타일링 지시가 달라야 한다.
 * `features`·`grooming`은 매체를 가리지 않고, `skin`은 사진 계열 톤에만 붙는다.
 *
 * `grooming`이 09-22에 갈라져 나왔다. 그 전에는 `features` 안에 "절제된 스타일링"으로만 있었고,
 * 결과가 **머리도 안 만지고 화장도 안 한 일반인**으로 떨어졌다. 관리는 사실성과 다른 축이다 —
 * 모공이 보이는 진짜 피부와 살롱 머리는 같이 갈 수 있고, 인플루언서 사진이 정확히 그 둘의 합이다.
 *
 * "예쁜·완벽한" 같은 형용사는 여전히 쓰지 않는다 — 그 말은 통제가 안 되고 특유의 AI 얼굴을 만든다.
 * 대신 **무엇이 관리돼 있는지**를 구체적으로 적는다(눈썹·베이스·립·컷·제품).
 * id는 마이그레이션 20260916000007 시드의 gender 행이다.
 */
type Presentation = {
  features: string;
  grooming: string;
  /** 한국 파운데이션 호수. 성별마다 기준이 다르다 — 아래 COMPLEXION_GUARD 주석 */
  complexion: string;
  skin: string;
};
const GENDER_PRESENTATION: Record<string, Presentation> = {
  // 여성
  "a2222222-0000-4000-8000-000000000001": {
    features:
      "Natural Korean features with distinctive, camera-ready bone structure and her own individual character. Real human anatomy, not app-filter geometry: no shrunken jaw, no facial structure melted away by smoothing.",
    grooming:
      "Korean makeup in a cool, low-saturation palette — cool rose, mauve, dusty pink and soft taupe, never coral, peach or orange. Keep the whole face barely-there: the impression is someone who simply looks good, not someone wearing a full face of makeup. Definition goes on the eyes and almost nowhere else — a very thin tightlined waterline in grey-brown rather than black, densely curled upper lashes and lightly defined lower lashes, the faintest wash of mauve-taupe on the lid carrying a soft sheen but almost no visible colour, and a softly highlighted under-eye ridge (aegyo-sal) so the eye reads full and round. Blush is almost imperceptible: a whisper of desaturated cool pink in a narrow band just under the eyes — never a coloured cheek, never a sweep across the cheekbones, never a flushed face. Soft ash-brown brows with visible hairs, light and never drawn on or dark. A dewy skin-like base and a sheer cool pink lip tint with a natural gloss, not a strong lip colour. Salon-cut hair that reads healthy and has clearly been styled on purpose, not left unbrushed — with the soft natural sheen of real hair, never a glossy or lacquered shine. If in doubt, apply less.",
    complexion:
      "Korean foundation shade 19 to 21, toward the 21 end of that range.",
    skin:
      "Clear, well-cared-for skin that still photographs as skin: fine pores and real high-frequency texture, carried on an even tone with smooth gradation across the face. No plastic or waxy smoothing and no airbrushing — but equally no mottled or blotchy patches, no invented blemishes, freckles or moles, and no dull or tired complexion.",
  },
  // 남성
  "a2222222-0000-4000-8000-000000000002": {
    features:
      "Natural Korean masculine features with distinctive, camera-ready bone structure and his own individual character. Real human anatomy, not app-filter geometry: no melted jawline, no cartoon proportions, no bodybuilder physique.",
    grooming:
      "Groomed, but wearing no makeup at all — only skincare, at the level a Korean man his age actually goes out in. Clean natural brows tidied at the edges, neat natural lashes, and clear well-cared-for skin with a healthy natural sheen rather than a matte or oily finish. No foundation, no eye makeup, no tinted lip, nothing that reads as applied. A deliberate salon haircut with matte product worked through it, facial hair either cleanly shaved or intentionally shaped for the age. Menswear styling with a current fashion sense.",
    complexion:
      "Korean foundation shade 21 to 23, a step deeper than the womens range and clearly not pale.",
    skin:
      "Clear, well-cared-for skin that still photographs as skin: visible pores and real high-frequency texture, with natural shadow along the jaw, carried on an even tone. No plastic or waxy smoothing — but equally no mottled or blotchy patches, no invented blemishes or moles, and no dull or tired complexion.",
  },
  // 중성적
  "a2222222-0000-4000-8000-000000000003": {
    features:
      "Deliberately androgynous presentation: balanced features with an editorial edge that do not read as clearly feminine or masculine. Do not fall back to a conventional feminine or masculine template.",
    grooming:
      "Groomed, but wearing essentially no makeup — skincare and tidy brows are enough, at the level someone with this presentation actually goes out in. Clean natural brows, neat natural lashes, and clear well-cared-for skin with a healthy natural sheen. Nothing that reads as applied colour: no visible eye makeup, no blush, no tinted lip. A sculpted unisex haircut that has obviously been styled, with contemporary unisex fashion styling.",
    complexion:
      "Korean foundation shade 21 as the reference point, give or take very little.",
    skin:
      "Clear, well-cared-for skin that still photographs as skin: fine pores and real high-frequency texture, carried on an even tone. No plastic or waxy smoothing — but equally no mottled or blotchy patches, no invented blemishes or moles, and no dull or tired complexion.",
  },
};
const DEFAULT_PRESENTATION: Presentation = {
  features:
    "Natural Korean features with distinctive, camera-ready bone structure and their own individual character; one specific person, never a repeated template face.",
  grooming:
    "Groomed and deliberately styled, with no makeup beyond skincare: neat natural brows, neat lashes, clear well-cared-for skin, healthy styled hair, contemporary fashion styling.",
  complexion:
    "Korean foundation shade 21 as the reference point.",
  skin:
    "Clear, well-cared-for skin that still photographs as skin: fine pores and real high-frequency texture, carried on an even tone. No plastic or waxy smoothing — but equally no mottled or blotchy patches, no invented blemishes or moles, and no dull or tired complexion.",
};

/**
 * 눈. 사진 한 장으로 보면 괜찮은데 **영상에서 밋밋해지는** 자리라 또렷하게 키운다. — 09-22 3차
 *
 * 키우는 건 인상이지 해부학이 아니다. 화장·속눈썹·빛으로 키우고, 눈구멍·홍채·눈꺼풀·앞머리
 * 구조는 실제 성인 그대로 둔다. 이 구분이 없으면 앱 필터의 인형 눈이 되고,
 * 그게 정확히 `avoid`의 beauty-filter look이다.
 *
 * 사진 계열 톤에만 붙인다 — 애니·3D는 매체가 이미 큰 눈을 갖고 있다.
 */
const EYE_DIRECTION =
  "The eyes are the focal point and must read large, open and bright — they have to keep carrying once the character moves in video, where subtle definition flattens out. Get there with light, lash definition and whatever grooming this particular character actually wears: an open unshadowed eye socket, well-defined lashes, and a large clear catchlight in a warm brown iris. Do not add makeup to a character whose grooming says they wear none. Keep the eye round and wide open rather than elongated into a cat-eye. Never with warped anatomy — the eye socket, iris size, lid structure and inner-corner shape stay those of a real Korean adult.";

/**
 * 머릿결. **윤기를 뺀다.** — 09-29
 *
 * 그 전 결과물은 머리가 한 덩어리의 광택면으로 나왔다 — 거울 같은 하이라이트 띠, 젖은 듯한 광,
 * 모든 가닥이 같은 방향으로 붙은 CG 머리. 사진에서 AI 티가 가장 먼저 나는 자리가 이것이다.
 * 진짜 머리는 가닥이 제각각이고, 잔머리가 있고, 빛을 넓고 부드럽게 흩어 낸다.
 * `grooming`의 "glossy"를 걷어내고, 사진 계열 톤에는 이 문장을 붙이고, `avoid`에도 넣는다.
 */
const HAIR_TEXTURE =
  "Hair renders as real hair, not a glossy shell: a soft diffused natural sheen rather than a mirror-like highlight band or a wet, lacquered look; individual strands going slightly different directions, a few fine flyaways at the hairline and crown, and slight variation in tone between strands. Well-groomed, but matte-leaning rather than shiny.";

/**
 * 피부 색조. 한국 파운데이션 호수로 준다 — 성별마다 기준이 다르다. — 09-22 4차
 *
 *   여성 19~21호(21 쪽) · 남성 21~23호 · 중성 21호 기준
 *
 * 호수는 `GENDER_PRESENTATION`의 `complexion`에 있고, **막을 것은 성별을 안 가려서** 여기 둔다.
 * 양쪽을 다 막아야 한다 — 창백한 도자기 피부(13·17호)와, 블러셔가 번진 붉은 얼굴.
 * 모델이 호수를 모를 수 있으니 숫자와 설명을 같이 준다.
 *
 * 바탕은 뉴트럴~살짝 웜한 한국인 베이지고, **그 위에 올라가는 화장만 쿨톤**이다.
 * 레퍼런스(사용자 제공 10장)가 정확히 그 조합이다 — 웜한 베이지 피부 + 쿨톤 화장.
 */
const COMPLEXION_GUARD =
  "This is a natural Korean beige with a neutral to barely warm undertone. Never porcelain-white, bleached or grey-pale, and never a ruddy, flushed or sunburnt red. Any makeup sits on top of this skin tone; it does not lighten or change the skin tone itself.";

/**
 * 캐스팅 수준. **이게 09-22 2차에 새로 생긴 자리다.**
 *
 * 그 전에는 프롬프트 어디에도 "얼마나 매력적인가"를 정하는 줄이 없었고, 대신
 * `not idealized` · `individual character` · `understated`가 세 군데에 깔려 있어서
 * 결과가 전부 **길에서 마주칠 법한 일반인**으로 떨어졌다.
 *
 * 사실성(모공·질감·비대칭)과 캐스팅(골격·존재감)은 다른 축이다. 사실성 지시는 그대로 두고
 * 이 줄로 캐스팅만 올린다. 성별을 가리지 않는다 — 남성·중성도 같은 급으로 캐스팅한다.
 */
const CASTING_LEVEL =
  "Cast at the level of a working fashion model or a Korean Instagram fashion influencer with a large following: distinctive camera-ready bone structure, clean proportions, and real presence in the frame. Aspirational rather than ordinary — the kind of person an audience chooses to follow. Still one specific individual with their own face, never a repeated template.";

/**
 * 후보마다 **얼굴 윤곽만** 달리 준다. 각도·시선·크롭은 네 장이 똑같다.
 *
 * 09-22 2차에 각도와 시선을 같이 돌려 봤는데, 후보 그리드에서 **고르기가 어려워졌다.**
 * 네 장이 서로 다른 방향을 보고 있으면 비교 대상이 사람이 아니라 사진이 된다.
 * 후보 그리드의 일은 "어느 사진이 예쁜가"가 아니라 "어느 얼굴을 쓸 것인가"를 고르는 것이다 —
 * 그래서 촬영 조건을 고정하고 얼굴만 바꾼다. 카탈로그 미감은 `composition`이 따로 지킨다.
 */
const FACE_VARIATIONS = [
  "gently oval facial proportions and softly defined features",
  "a softly tapered face and subtly defined cheekbones",
  "a softly rounded face and balanced facial proportions",
  "a softly angular face and a clearly defined jawline",
];

/**
 * 얼굴상(강아지상·고양이상…)을 골랐을 때의 후보 차이. — 09-29
 *
 * 얼굴상이 윤곽을 이미 정하고 있어서(공룡상은 긴 얼굴, 두부상은 둥근 얼굴) 위의 윤곽 변주를
 * 그 위에 얹으면 서로 싸운다. 대신 **같은 얼굴상을 얼마나 세게 읽을지**로 넷을 가른다.
 */
const FACE_TYPE_VARIATIONS = [
  "a softer, rounder reading of that face type",
  "a sharper, more defined reading of that face type",
  "a more delicate, smaller-featured reading of that face type",
  "a bolder, stronger-featured reading of that face type",
];

/**
 * 1단계 — 카탈로그 톤의 미감과 사용자 속성을 함께 지키는 새 성인 인물.
 *
 * 구조화된 JSON 텍스트로 보낸다. 고정되는 것(identity)과 바뀌는 것(scene·styling)을 나눠 두면
 * 모델이 "사람"과 "그날의 연출"을 섞지 않는다. — docs/캐릭터-생성-프롬프트.md
 *
 * 사진 계열 톤에는 natural skin texture · editorial/lifestyle photography · shallow depth of field
 * 같은 실사 어휘를 붙이고, 애니·3D에는 붙이지 않는다.
 * **색은 톤이 정한다.** 공통 지시로 muted neutral을 깔면 어떤 톤을 골라도 회색 사진이 나온다.
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
  const faceType = pick("face");
  const hair = pick("hair");
  const hairColor = pick("hair_color");
  const body = pick("body");
  const vibe = pick("vibe");

  const photographic = isPhotographicTone(tone);
  const presentation = GENDER_PRESENTATION[traits.gender ?? ""] ??
    DEFAULT_PRESENTATION;
  const slot = ((Math.trunc(candidateIndex) || 0) % FACE_VARIATIONS.length +
    FACE_VARIATIONS.length) % FACE_VARIATIONS.length;
  // 얼굴상을 골랐으면 그 얼굴상이 윤곽을 정한다. 후보 차이는 읽는 세기로 낸다.
  const face = faceType
    ? `${faceType}; ${FACE_TYPE_VARIATIONS[slot]}`
    : FACE_VARIATIONS[slot];

  // 고른 나이대는 협상 대상이 아니다. 사진이 아무리 좋아도 다른 연령대로 읽히면 틀린 결과다.
  const ageDirection = `${
    AGE_DIRECTION[traits.age ?? ""] ?? DEFAULT_AGE_DIRECTION
  } The selected age bracket is a hard requirement — a face that reads as a different decade is wrong, however good the image is. Grooming, styling and makeup follow that age rather than ageing the person up.`;

  const request: Record<string, unknown> = {
    task:
      "Create one original fictional Korean adult character for a character casting catalog. A new, individual person with their own face, not a celebrity likeness and not a generic template face. Never depict a child or teenager. Return a single image.",
    scene: {
      description: tone.prompt,
      mood: vibe
        ? `${vibe}; a real, felt expression caught mid-moment rather than held for the camera.`
        : "A composed, self-possessed presence caught mid-moment rather than held for the camera.",
    },
    subject: {
      identity_fixed: {
        ethnicity: "East Asian (Korean)",
        gender: gender ?? "an adult",
        age: age ?? "an adult",
        age_direction: ageDirection,
        face,
        ...(body ? { build: body } : {}),
        ...(hair || hairColor
          ? { hair: [hair, hairColor].filter(Boolean).join(", ") }
          : {}),
        priority:
          "These selected traits override any styling default. Preserve the selected gender presentation, age, face type, hairstyle, hair color and body type exactly.",
      },
      casting: CASTING_LEVEL,
      presentation: photographic
        ? `${presentation.features} ${presentation.grooming} ${HAIR_TEXTURE} ${EYE_DIRECTION} Complexion depth: ${presentation.complexion} ${COMPLEXION_GUARD} ${presentation.skin}`
        : `${presentation.features} ${presentation.grooming}`,
      styling: {
        wardrobe:
          "Current Korean fashion styling that belongs in the scene: well-fitted, in one considered color with visible fabric texture (knit, wool, cotton, denim). It must look chosen and put together, never thrown on or shapeless — while still not pulling attention off the face.",
        expression: vibe
          ? `A believable expression consistent with ${vibe}, with real focus and presence in the eyes; small asymmetries and individual character kept. Not a blank, evenly neutral face and not a tired one.`
          : "A calm, self-possessed expression with real focus and presence in the eyes; small asymmetries and individual character kept. Not a blank, evenly neutral face and not a tired one.",
      },
    },
  };

  // 카탈로그(tone/1·3·4.jpg)의 크롭이되 **네 장이 같은 조건으로 찍힌다.**
  // 정면 응시·중앙 정렬은 후보를 나란히 놓고 고르기 위한 것이고,
  // 여권 사진을 막는 일은 크롭(큰 얼굴·좁은 헤드룸)과 살아 있는 배경이 한다.
  // "comfortable headroom"과 "face nearly forward"로 되돌아가면 안 된다.
  const composition = [
    "Vertical 3:4 portrait framed chest-up at eye level.",
    "The person faces the camera straight on, head square to the frame and centered, with both eyes looking directly into the lens. Every candidate is shot under these same conditions so they can be compared side by side.",
    "The head sits high and large in the frame with little headroom — a magazine crop, not a passport photo.",
    "Keep the whole head and hair inside the frame and the face unobstructed.",
    "Behind the person is a real place with light falling across it, held well out of focus.",
  ].join(" ");

  if (photographic) {
    request.camera_technical = {
      capture:
        "Photorealistic still photograph at premium commercial quality, as if shot on a high-resolution full-frame camera and delivered from RAW. Realistic lens rendering consistent with the described scene, shallow depth of field, crisp focus on the eyes, high microcontrast, and natural exposure with realistic specular highlights and soft natural shadows. No low-resolution mush, compression artifacts, colour bleed or smeared edges anywhere in the frame.",
      composition,
      color:
        "Commit to the color and light described in the scene: a deliberate color mood, warm or cool, with believable saturation that is not flattened toward grey. Light should shape the face and the space behind it. Keep white balance neutral and clean at roughly 5500K so skin stays true. Warm light in the scene is welcome; a yellow, orange or green cast over the whole photograph is not, and the makeup itself stays cool-toned regardless of how warm the light is.",
      retouching:
        "Premium commercial retouching: even out skin tone and clear low-quality mottling, while preserving high-frequency skin texture, pores and fine facial detail. Render the iris, eyelashes, brows, individual hair strands and fabric weave crisply and cleanly; keep hair strands separate and matte-leaning rather than fused into one shiny surface. Do not invent blemishes, freckles or moles; do not smooth skin toward plastic; no haloing, no oversharpening, no heavy HDR.",
      style:
        "Korean editorial and lifestyle photography: candid, understated, authentic; reads as a real photograph, not a render.",
    };
    request.avoid = [
      "beauty-filter or CGI look, plastic, waxy or overly smooth skin",
      "hair rendered as one glossy lacquered mass: a mirror-like highlight band, wet-look or CGI shine, every strand fused in the same direction",
      "mottled, blotchy or patchy skin tone; low-resolution noise, compression artifacts, colour bleed or smeared detail",
      "coral, peach or orange makeup of any kind; a strong warm blush sweep across the cheekbones; a flushed red face",
      "a full face of makeup: coloured eyelids, coloured cheeks, a strong lip colour, drawn-on dark brows",
      "porcelain-white, bleached or grey-pale skin",
      "invented blemishes, freckles or moles that were not asked for",
      "a global yellow, orange or green colour cast over the whole image (warm makeup tones are fine, a tinted photograph is not)",
      "a perfectly symmetrical template face repeated from one image to the next",
      "plain unstyled casting: unbrushed or frizzy hair, no grooming, a tired or washed-out complexion",
      "passport or ID-photo framing: head centered with wide empty headroom",
      "lighting equipment, softbox, light stand, reflector, tripod or set edge visible in the frame",
      "an empty flat backdrop with no light, shadow or depth behind the person",
      "flat frontal light that leaves no shadow shaping on the face",
      "washed-out grey grading, blown highlights, crushed blacks, heavy vignette",
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
      "exaggerated doll-like proportions or a repeated template face",
      "hair drawn as one glossy lacquered mass with a mirror-like highlight band",
      "plain unstyled casting: unbrushed hair, no grooming, a washed-out face",
      "passport or ID-photo framing: head centered with wide empty headroom",
      "an empty flat backdrop with no light, shadow or depth behind the person",
      "text, caption, watermark, logo, border, collage or comparison grid",
      "more than one person, hands or objects covering the face",
    ];
  }

  request.output =
    "One person, one complete portrait filling the frame edge to edge. Coherent anatomy and facial proportions for the selected medium.";

  return JSON.stringify(request, null, 2);
}

/**
 * 1단계 뒤의 모든 단계가 공통으로 지켜야 하는 것. — 09-22 5차
 *
 * 1단계에서 캐스팅·화장 강도·피부 호수·나이대·눈을 공들여 정해도,
 * **이름을 부르지 않으면 편집 모델이 떨군다.** "같은 사람"만으로는 부족하다 —
 * 같은 얼굴에 화장을 새로 얹거나, 피부를 하얗게 만들거나, 나이를 올려 버린다.
 *
 * 다듬기(3단계) · 3방향(4단계) · 룩이 전부 이 문장을 쓴다.
 * 여기 없는 항목은 그 단계에서 유지되지 않는다고 봐야 한다.
 */
export const IDENTITY_LOCK =
  "keep the same person: the same face and identity, the same apparent age, the same complexion depth and skin tone, the same makeup at the same strength, and the same natural matte-leaning hair texture — do not add makeup or make it stronger, do not lighten or warm the skin, do not age the face, do not add gloss to the hair";

/** 갈래마다 지시문이 다르다. "머리를 단발로"와 "체형을 마른으로"는 같은 문장이 아니다. */
const CHANGE_PHRASE: Record<string, (p: string) => string> = {
  hair: (p) => `change the hairstyle to ${p}`,
  hair_color: (p) => `change the hair color to ${p}`,
  body: (p) => `change the body type to ${p}`,
  vibe: (p) => `change the expression to ${p}`,
};

/**
 * 얼굴 세부 조정 — 슬라이더. — 09-29 · docs/기획서.md §3
 *
 * 칩으로는 못 정하는 것(눈꼬리 각도, 콧대 높이, 눈썹 높이, 머리색 강도)을 -2 ~ +2 다섯 칸으로 받는다.
 * 자유 프롬프트가 아니다 — 값은 정수, 문장은 여기서만 만든다.
 *
 * **지시는 상대값이다.** 편집 모델은 지금 얼굴(base image)을 입력으로 받으니, 저장된 값과
 * 새 값의 **차이**만큼 "조금 더 / 확실히 더" 움직이라고 말한다. 절대값("+2로")은 모델에게 의미가 없다.
 * 화면의 `ADJUSTMENTS`(models.ts)와 키·범위가 같아야 한다.
 */
export const ADJUSTMENT_KEYS = [
  "hair_color_depth",
  "eye_tilt",
  "eye_height",
  "nose_height",
  "nose_tilt",
  "brow_tilt",
  "brow_height",
] as const;
export type AdjustmentKey = (typeof ADJUSTMENT_KEYS)[number];
export type Adjustments = Partial<Record<AdjustmentKey, number>>;
export const ADJUSTMENT_RANGE = 2;

/** 받은 값 중 우리가 아는 키의 정수(-2~2)만 남긴다. 0은 "그대로"라 버린다. */
export function asAdjustments(value: unknown): Adjustments {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Adjustments = {};
  for (const key of ADJUSTMENT_KEYS) {
    const raw = (value as Record<string, unknown>)[key];
    if (typeof raw !== "number" || !Number.isInteger(raw) || raw === 0) continue;
    if (Math.abs(raw) > ADJUSTMENT_RANGE) continue;
    out[key] = raw;
  }
  return out;
}

/** 얼마나 움직이는가. 차이 1칸은 "조금", 2칸은 "확실히", 그 이상은 "크게". */
function degree(delta: number): string {
  const steps = Math.abs(delta);
  return steps >= 3 ? "strongly" : steps === 2 ? "clearly" : "slightly";
}

/**
 * 키마다 문장이 다르다. `up`은 값이 커지는 방향의 지시, `down`은 작아지는 방향.
 * 눈·코·눈썹은 "그것만" 바꾸고 나머지 얼굴은 그대로 두라는 말을 끝에 붙인다 —
 * 그 말이 없으면 편집 모델이 눈을 손보면서 얼굴을 다시 그린다.
 */
const ADJUST_PHRASE: Record<AdjustmentKey, { up: (d: string) => string; down: (d: string) => string }> = {
  hair_color_depth: {
    up: (d) => `make the hair color ${d} deeper and more saturated, keeping the same hue`,
    down: (d) => `make the hair color ${d} lighter and softer, keeping the same hue`,
  },
  eye_tilt: {
    up: (d) => `tilt the outer corners of the eyes ${d} upward`,
    down: (d) => `tilt the outer corners of the eyes ${d} downward`,
  },
  eye_height: {
    up: (d) => `place the eyes ${d} higher on the face`,
    down: (d) => `place the eyes ${d} lower on the face`,
  },
  nose_height: {
    up: (d) => `make the nose bridge ${d} higher and more defined`,
    down: (d) => `make the nose bridge ${d} lower and softer`,
  },
  nose_tilt: {
    up: (d) => `turn the nose tip ${d} upward`,
    down: (d) => `turn the nose tip ${d} downward`,
  },
  brow_tilt: {
    up: (d) => `angle the eyebrows ${d} upward toward the temples`,
    down: (d) => `angle the eyebrows ${d} downward, flatter and softer`,
  },
  brow_height: {
    up: (d) => `raise the eyebrows ${d} higher above the eyes`,
    down: (d) => `set the eyebrows ${d} lower, closer to the eyes`,
  },
};

/** 저장된 값과 새 값의 차이만 문장으로. 바뀐 게 없으면 빈 배열. */
export function adjustmentPhrases(before: Adjustments, after: Adjustments): string[] {
  const phrases: string[] = [];
  for (const key of ADJUSTMENT_KEYS) {
    const delta = (after[key] ?? 0) - (before[key] ?? 0);
    if (delta === 0) continue;
    const phrase = ADJUST_PHRASE[key];
    phrases.push(delta > 0 ? phrase.up(degree(delta)) : phrase.down(degree(delta)));
  }
  return phrases;
}

/**
 * 3단계 — **바뀐 것만** 지시문으로 만든다.
 * 전체 설명을 다시 넘기면 편집 모델이 얼굴까지 새로 그린다.
 * 바꾼 게 없으면 null — 호출부가 NO_CHANGES로 돌려준다.
 *
 * 칩(traits)과 슬라이더(adjustments)가 한 지시문에 같이 들어간다 — 한 번의 수정이 1크레딧이라
 * 사람이 둘을 한꺼번에 고쳐도 한 번만 낸다.
 */
export function editInstruction(
  before: Traits,
  after: Traits,
  options: Map<string, Option>,
  adjustBefore: Adjustments = {},
  adjustAfter: Adjustments = {},
): string | null {
  const changes: string[] = [];

  for (const kind of REFINABLE_TRAITS) {
    const next = after[kind];
    if (!next || next === before[kind]) continue;
    const option = options.get(next);
    if (!option) continue;
    changes.push(CHANGE_PHRASE[kind](option.prompt));
  }

  const adjustments = adjustmentPhrases(adjustBefore, adjustAfter);
  if (adjustments.length > 0) {
    changes.push(
      `${adjustments.join(", ")} — change only those features and leave every other part of the face exactly as it is`,
    );
  }

  if (changes.length === 0) return null;

  return [
    changes.join(", "),
    IDENTITY_LOCK,
    "keep the same lighting and framing",
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
    IDENTITY_LOCK,
    // 3방향은 영상 변환(Wan-Animate)이 얼굴을 옮겨 오는 유일한 레퍼런스다. 영상 모델은 텍스트를
    // 안 받으니 영상에 살아남아야 할 것(눈빛·시선·표정)은 전부 여기서 그림에 박아 둔다. — 09-29
    VIDEO_REFERENCE_DIRECTION,
    "keep the same hairstyle, clothing and lighting",
    // 여기서는 무지 배경이 맞다 — 3방향은 연기 영상이 쓰는 레퍼런스지 작품이 아니다. — 기획서 §10
    "plain neutral background, upper body",
  ].join(". ");
}

/**
 * 영상 레퍼런스용 지시. — 09-29
 *
 * 영상 변환(fal Wan-Animate Replace)은 `video_url`·`image_url`만 받고 **프롬프트를 받지 않는다.**
 * 그래서 영상 품질을 텍스트로 올릴 자리는 레퍼런스 이미지(3방향)를 만드는 이 지시문뿐이다.
 * 영상 프롬프트 가이드(정체성 고정 · 시선축 유지 · 표정을 구체적 행동으로)에서 이미지에 적용되는 것만 가져왔다.
 *   - 고정 형질(immutable traits)을 이름으로 부른다: 골격·눈 모양·헤어라인·머리색·피부 톤·화장
 *   - 눈은 영상에서 뭉개지는 자리라 캐치라이트·홍채·속눈썹을 또렷하게, 시선은 렌즈로
 *   - 표정은 "자연스럽게"가 아니라 근육의 상태로 적는다: 이완된 이마, 살짝 든 입꼬리, 살아 있는 눈
 */
export const VIDEO_REFERENCE_DIRECTION =
  "this image is a motion reference: keep these immutable traits identical to the source — facial bone structure, eye shape and spacing, eyebrow shape, nose, lip shape, hairline, hair color and texture, skin tone and makeup. Eyes sharp and open with a clear catchlight, crisp iris detail and defined lashes, gaze steady into the lens along the same eye line. A relaxed, alive expression: relaxed forehead, soft jaw, a faint lift at the mouth corners, presence in the eyes rather than a blank stare. Face fully lit and unobstructed, no hair across the eyes, no motion blur";

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
    IDENTITY_LOCK,
    "natural lighting, one person only",
  ].join(". ");
}
