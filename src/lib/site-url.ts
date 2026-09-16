/**
 * origin은 항상 이 파일을 거친다. — CLAUDE.md 아키텍처 규칙 8
 *
 * 로컬을 쓰지 않고 Vercel 배포본만 쓰기로 해서, 운영 URL을 여기 한 줄에 고정했다.
 * 바꿔야 할 일이 생기면 아래 PRODUCTION_URL 한 줄이거나 `NEXT_PUBLIC_SITE_URL` 하나다.
 * 컴포넌트나 라우트에서 URL을 직접 쓰지 않는다.
 */

/**
 * 운영 URL. 커스텀 도메인을 붙이면 여기를 바꾼다.
 * 환경변수 `NEXT_PUBLIC_SITE_URL`이 있으면 그쪽이 이긴다 — 프리뷰 브랜치에서만 따로 쓰고 싶을 때.
 */
const PRODUCTION_URL = "https://ai-daeyeok.vercel.app";

function normalize(origin: string): string {
  const withProtocol = /^https?:\/\//.test(origin) ? origin : `https://${origin}`;
  return withProtocol.replace(/\/+$/, "");
}

/** 이 앱의 고정 origin. 프로토콜 포함, 끝에 슬래시 없음. */
export const SITE_URL = normalize(
  process.env.NEXT_PUBLIC_SITE_URL || PRODUCTION_URL,
);

/**
 * OAuth가 돌아올 주소.
 * 고정 URL이라 Supabase Redirect URLs에 `https://ai-daeyeok.vercel.app/**` 한 줄이면 된다.
 */
export function callbackUrl(next: string): string {
  const url = new URL("/auth/callback", SITE_URL);
  url.searchParams.set("next", safeNextPath(next));
  return url.toString();
}

/**
 * 리다이렉트 파라미터 검증. — CLAUDE.md 아키텍처 규칙 7
 * `/`로 시작하고 `//`로 시작하지 않는 상대 경로만 허용한다. 그 외에는 기본 경로로 강제한다.
 */
export function safeNextPath(next: string | null | undefined): string {
  if (!next) return "/dashboard";
  if (!next.startsWith("/")) return "/dashboard";
  if (next.startsWith("//")) return "/dashboard";
  // `/\evil.com` 같은 백슬래시 우회를 막는다
  if (next.startsWith("/\\")) return "/dashboard";
  return next;
}
