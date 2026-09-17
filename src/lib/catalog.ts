/**
 * 카탈로그 사진 — 톤 6장과 룩 프리셋 16장. (2026-09-17 SVG 그림 → 사진으로 교체)
 *
 * 사용자가 만든 파일이 아니라 모두가 똑같이 보는 고정 그림이라 버킷에 두지 않고
 * `public/catalog/`에 앱과 같이 싣는다. 서명할 필요도, 스토리지를 한 번 더 부를 필요도 없다.
 * (사용자 파일이 private 버킷 + signed URL로만 나가는 규칙은 그대로다 — CLAUDE.md 아키텍처 규칙 4)
 *
 * 키는 DB의 `thumbnail_path`다(`tone/1.jpg`, `hair/1.jpg` …). 확장자는 보지 않는다.
 * 이미지를 바꿀 때는 같은 이름의 파일을 갈아끼운다. 형식(jpg·webp…)이 바뀌면 아래 EXT도 같이 바꾼다.
 * 여기 없는 경로(새로 추가한 행)는 null이라, 부르는 쪽이 예전처럼 버킷에서 서명한다.
 */
const EXT = "jpg";

const CATALOG = new Set<string>([
  ...[1, 2, 3, 4, 5, 6].map((n) => `tone/${n}`),
  ...["hair", "top", "bottom", "scene"].flatMap((slot) =>
    [1, 2, 3, 4].map((n) => `${slot}/${n}`),
  ),
]);

export function catalogUrl(thumbnailPath: string | null): string | null {
  if (!thumbnailPath) return null;
  const key = thumbnailPath.replace(/\.[a-z0-9]+$/i, "");
  return CATALOG.has(key) ? `/catalog/${key}.${EXT}` : null;
}

/**
 * 톤 사진의 성별 변형.
 *
 * 기본 사진(`tone/<n>`)은 여성이다. 남성·중성적은 `tone/male/<n>`·`tone/neutral/<n>`에 둔다.
 * 키는 character_options(gender)의 고정 id다 — 시드 20260916000007과 fixtures.ts가 같은 id를 쓴다.
 */
const TONE_GENDER_FOLDER: Record<string, string | null> = {
  "a2222222-0000-4000-8000-000000000001": null, // 여성 — 기본 사진
  "a2222222-0000-4000-8000-000000000002": "male", // 남성
  "a2222222-0000-4000-8000-000000000003": "neutral", // 중성적
};

/**
 * 사진 6장이 **다 들어간** 변형만 여기 넣는다. 파일을 넣기 전에 켜면 타일이 깨진다.
 * 켜지 않은 변형은 null이 돼서 화면이 기본(여성) 사진을 그대로 보여준다.
 * 사진을 넣으면 "male" / "neutral"을 추가한다. 프롬프트는 docs/카탈로그-이미지-프롬프트.md
 */
const READY_TONE_VARIANTS = new Set<string>([]);

export function toneVariantUrl(
  thumbnailPath: string | null,
  genderOptionId: string,
): string | null {
  const folder = TONE_GENDER_FOLDER[genderOptionId];
  if (!folder || !READY_TONE_VARIANTS.has(folder) || !thumbnailPath) return null;
  const n = thumbnailPath.replace(/\.[a-z0-9]+$/i, "").match(/^tone\/(\d+)$/)?.[1];
  return n ? `/catalog/tone/${folder}/${n}.${EXT}` : null;
}
