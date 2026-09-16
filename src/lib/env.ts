/**
 * 웹에 존재해도 되는 환경변수는 이 둘뿐이다. — CLAUDE.md 아키텍처 규칙 9
 * `SUPABASE_SERVICE_ROLE_KEY`와 `FAL_KEY`는 Supabase Edge Function 시크릿에만 둔다.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * Supabase 프로젝트가 아직 연결되지 않았는지.
 *
 * 연결 전에는 데이터 레이어가 화면을 그릴 수 있는 만큼의 고정 데이터를 돌려준다.
 * 타입은 실제 스키마와 동일하므로, 환경변수를 채우면 같은 화면이 실제 데이터로 바뀐다.
 */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
