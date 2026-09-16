import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/lib/env";
import type { Database } from "@/types/database";

/** 로그인 없이 볼 수 있는 경로 */
const PUBLIC_PREFIXES = ["/login", "/auth", "/kitchen-sink"];

function isPublic(pathname: string) {
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * 매 요청마다 세션 쿠키를 갱신하고, 로그인하지 않은 접근을 `/login`으로 돌린다.
 *
 * 여기서 하는 건 낙관적 검사일 뿐이다. 실제 접근 제어는 RLS가 한다.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Supabase가 아직 연결되지 않은 개발 환경에서는 화면만 돌려본다.
  if (!isSupabaseConfigured) return response;

  const supabase = createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // getUser()를 호출해야 만료된 토큰이 갱신된다. 이 줄을 지우면 세션이 조용히 끊긴다.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;

  if (!user && !isPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    if (pathname !== "/") {
      url.searchParams.set("next", `${pathname}${search}`);
    }
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
