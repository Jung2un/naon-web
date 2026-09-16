import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";

/**
 * service_role은 RLS를 전부 무시한다. 이 클라이언트는 함수 안에서만 만들고
 * 절대 밖으로 내보내지 않는다. — CLAUDE.md 아키텍처 규칙 9
 */
export function adminClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

/**
 * 부른 사람이 누구인지 확인한다.
 * `supabase.functions.invoke`가 사용자 JWT를 Authorization 헤더로 실어 보낸다.
 * 토큰이 없거나 만료면 null — 호출부가 SESSION_EXPIRED로 돌려준다.
 */
export async function callerId(req: Request): Promise<string | null> {
  const authorization = req.headers.get("Authorization");
  if (!authorization) return null;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user.id;
}

/**
 * 크레딧 차감. 잔액이 모자라면 null.
 * 확인과 차감이 SQL 함수 한 문장 안에서 끝난다 —
 * 여기서 잔액을 읽고 쓰면 동시 요청에 새는 구간이 생긴다.
 */
export async function charge(
  admin: SupabaseClient,
  userId: string,
  amount: number,
  reason: string,
  memo: string,
): Promise<number | null> {
  const { data, error } = await admin.rpc("charge_credits", {
    p_user_id: userId,
    p_amount: amount,
    p_reason: reason,
    p_job_id: null,
    p_memo: memo,
  });
  if (error) throw error;
  return data as number | null;
}

/** 환불. 실패했으면 조건 없이 돌려준다. 두 번 부르지 않는 건 호출부 책임이다. */
export async function refund(
  admin: SupabaseClient,
  userId: string,
  amount: number,
  reason: string,
  memo: string,
): Promise<void> {
  const { error } = await admin.rpc("refund_credits", {
    p_user_id: userId,
    p_amount: amount,
    p_reason: reason,
    p_job_id: null,
    p_memo: memo,
  });
  // 환불 실패는 삼키지 않는다. 로그에 남겨야 사람이 찾아서 고칠 수 있다.
  if (error) console.error("환불 실패", { userId, amount, reason, memo, error });
}
