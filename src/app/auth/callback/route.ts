import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/site-url";

/**
 * OAuth 콜백. origin은 요청에서 뽑는다 — 로컬·프리뷰·운영이 한 코드로 돌아야 한다.
 * `next`는 상대 경로만 허용한다. 안 막으면 오픈 리다이렉트다. — docs/배포.md §5
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (searchParams.get("error")) {
    const reason =
      searchParams.get("error") === "access_denied"
        ? "OAUTH_CANCELLED"
        : "OAUTH_FAILED";
    return NextResponse.redirect(`${origin}/login?error=${reason}`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=OAUTH_FAILED`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=OAUTH_FAILED`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
