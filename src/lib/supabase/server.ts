import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * 서버 컴포넌트 · 라우트 핸들러 · 서버 액션에서 쓰는 클라이언트.
 * `@supabase/auth-helpers-nextjs`는 deprecated다. 반드시 `@supabase/ssr`. — CLAUDE.md
 *
 * Next 16에서 `cookies()`는 비동기다.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // 서버 컴포넌트에서는 쿠키를 쓸 수 없다.
          // 세션 갱신은 proxy가 맡으므로 여기서는 무시해도 된다.
        }
      },
    },
  });
}
