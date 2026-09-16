import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * Next 16부터 `middleware`는 `proxy`로 이름이 바뀌었다. 런타임은 nodejs 고정이다.
 * 하는 일은 Supabase 세션 쿠키 갱신 + 미로그인 리다이렉트뿐이다.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * 정적 자산과 이미지 최적화 요청을 뺀 전부.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4)$).*)",
  ],
};
