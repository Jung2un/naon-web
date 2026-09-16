import type { SupabaseClient } from "@supabase/supabase-js";
import { FunctionsHttpError } from "@supabase/supabase-js";

/**
 * Edge Function 호출은 이 함수를 거친다.
 *
 * `supabase.functions.invoke`는 함수가 2xx가 아닌 응답을 주면 error.message를
 * "Edge Function returned a non-2xx status code"로 채운다. 본문에 담긴 진짜 코드는
 * error.context(Response) 안에 있어서, 그냥 쓰면 화면이 INSUFFICIENT_CREDITS를
 * 영영 못 보고 전부 "문제가 생겼어요"로 떨어진다.
 *
 * 그래서 본문의 `{ "error": "CODE" }`를 꺼내 Error.message에 실어 던진다.
 * 부르는 쪽은 잡아서 `humanError(e.message)` 하면 된다. — CLAUDE.md 문구 규칙
 */
export async function invokeFunction<T>(
  supabase: SupabaseClient,
  name: string,
  body: Record<string, unknown>,
): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(name, { body });
  if (!error) return data as T;

  let code: string | null = null;
  if (error instanceof FunctionsHttpError) {
    try {
      const payload = await error.context.json();
      if (payload && typeof payload.error === "string") code = payload.error;
    } catch {
      // 본문이 JSON이 아니면 원래 에러를 그대로 올린다
    }
  }

  throw code ? new Error(code) : error;
}
