-- 크레딧 차감·환불
--
-- Edge Function에서 잔액을 읽고 나서 쓰면 그 사이에 다른 요청이 끼어든다.
-- 확인과 차감을 `update ... where credits >= ? returning credits` 한 문장으로 끝내고,
-- 원장 기록까지 같은 트랜잭션에 둔다. 함수 하나가 통째로 성공하거나 통째로 없던 일이 된다.
--
-- security definer로 두되 실행 권한은 service_role에만 준다.
-- 클라이언트(anon/authenticated)가 이걸 부를 수 있으면 RLS를 우회하는 구멍이 된다.
-- profiles_guard_credits 트리거가 한 겹 더 막지만, 권한을 안 주는 게 먼저다.

-- ---------------------------------------------------------------- 차감

-- 잔액이 모자라면 null을 돌려준다. 예외로 던지면 호출부가 문자열을 비교하게 된다.
-- 성공하면 차감 후 잔액.
create or replace function public.charge_credits(
  p_user_id uuid,
  p_amount  integer,
  p_reason  public.ledger_reason,
  p_job_id  uuid  default null,
  p_memo    text  default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_balance integer;
begin
  if p_amount <= 0 then
    raise exception '차감액은 양수여야 합니다 (받은 값: %)', p_amount;
  end if;

  update public.profiles
     set credits = credits - p_amount
   where id = p_user_id
     and credits >= p_amount
  returning credits into v_balance;

  -- 행이 안 돌아왔다 = 잔액 부족이거나 없는 사용자. 둘 다 차감이 일어나지 않았다.
  if v_balance is null then
    return null;
  end if;

  insert into public.credit_ledger (user_id, delta, balance_after, reason, job_id, memo)
  values (p_user_id, -p_amount, v_balance, p_reason, p_job_id, p_memo);

  return v_balance;
end;
$$;

-- ---------------------------------------------------------------- 환불

-- 환불은 잔액 조건이 없다. 실패했으면 무조건 돌려준다.
-- 두 번 부르면 두 번 들어간다 — 중복 호출을 막는 건 호출부(웹훅의 조건부 상태 전이)의 몫이다.
create or replace function public.refund_credits(
  p_user_id uuid,
  p_amount  integer,
  p_reason  public.ledger_reason,
  p_job_id  uuid  default null,
  p_memo    text  default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_balance integer;
begin
  if p_amount <= 0 then
    raise exception '환불액은 양수여야 합니다 (받은 값: %)', p_amount;
  end if;

  update public.profiles
     set credits = credits + p_amount
   where id = p_user_id
  returning credits into v_balance;

  if v_balance is null then
    return null;
  end if;

  insert into public.credit_ledger (user_id, delta, balance_after, reason, job_id, memo)
  values (p_user_id, p_amount, v_balance, p_reason, p_job_id, p_memo);

  return v_balance;
end;
$$;

-- ---------------------------------------------------------------- 권한

-- 함수는 기본적으로 PUBLIC에 실행 권한이 붙는다. 명시적으로 걷어낸다.
revoke all on function public.charge_credits(uuid, integer, public.ledger_reason, uuid, text)
  from public, anon, authenticated;
revoke all on function public.refund_credits(uuid, integer, public.ledger_reason, uuid, text)
  from public, anon, authenticated;

grant execute on function public.charge_credits(uuid, integer, public.ledger_reason, uuid, text)
  to service_role;
grant execute on function public.refund_credits(uuid, integer, public.ledger_reason, uuid, text)
  to service_role;
