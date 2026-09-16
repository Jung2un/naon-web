/**
 * 함수가 밖으로 내보내는 것은 이 파일을 거친다.
 *
 * 에러는 `{ "error": "CODE" }` 한 모양으로만 나간다. 그 CODE는 반드시
 * `src/lib/errors.ts`의 MESSAGES에 있는 것이어야 한다 — 화면이 그 코드만 사람 말로 바꾼다.
 * 없는 코드를 던지면 "문제가 생겼어요"라는 기본 문구로 떨어진다. — CLAUDE.md 문구 규칙
 */

/** `src/lib/errors.ts`에 문구가 있는 코드만 쓴다. 새 코드를 만들려면 거기부터 추가한다. */
export type ErrorCode =
  | "INSUFFICIENT_CREDITS"
  | "REF_INCOMPLETE"
  | "LOOK_INCOMPLETE"
  | "CHARACTER_NOT_READY"
  | "SESSION_EXPIRED"
  | "UPSTREAM_ERROR"
  | "TIMEOUT"
  | "FACE_NOT_FOUND"
  | "MULTIPLE_FACES";

/**
 * 브라우저가 직접 부르는 함수라 preflight가 온다.
 * 아무 origin이나 열지 않고 운영·프리뷰 도메인만 되비춘다.
 */
const ALLOWED_ORIGIN = /^https:\/\/ai-daeyeok(-[a-z0-9-]+)?\.vercel\.app$/;

export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
  if (ALLOWED_ORIGIN.test(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

export function preflight(req: Request): Response | null {
  if (req.method !== "OPTIONS") return null;
  return new Response(null, { status: 204, headers: corsHeaders(req) });
}

export function ok(req: Request, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}

export function fail(req: Request, status: number, code: ErrorCode): Response {
  return new Response(JSON.stringify({ error: code }), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}
