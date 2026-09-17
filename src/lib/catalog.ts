/**
 * 카탈로그 그림 — 톤 6장과 룩 프리셋 16장.
 *
 * 사용자가 만든 파일이 아니라 모두가 똑같이 보는 고정 그림이라 버킷에 두지 않고
 * `public/catalog/`에 앱과 같이 싣는다. 서명할 필요도, 스토리지를 한 번 더 부를 필요도 없다.
 * (사용자 파일이 private 버킷 + signed URL로만 나가는 규칙은 그대로다 — CLAUDE.md 아키텍처 규칙 4)
 *
 * 키는 DB의 `thumbnail_path`다(`tone/1.jpg`, `hair/1.jpg` …). 확장자는 보지 않는다.
 * 그림을 실사 이미지로 바꾸고 싶으면 같은 이름의 파일을 갈아끼우고 아래 EXT만 바꾸면 된다.
 * 여기 없는 경로(새로 추가한 행)는 null이라, 부르는 쪽이 예전처럼 버킷에서 서명한다.
 */
const EXT = "svg";

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
