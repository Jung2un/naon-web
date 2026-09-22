-- 테스트 계정(sunlightsnow123@gmail.com) 크레딧을 100,000으로 맞춘다.
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 실행.
--
-- profiles.credits 를 직접 UPDATE 하지 않는다. refund_credits 를 쓰면
-- 잔액과 credit_ledger 가 같은 트랜잭션에서 같이 움직인다 — 원장이 안 어긋난다.
-- reason 은 'adjustment' (ledger_reason enum에 이미 있는 값이다).
-- 이미 100,000 이상이면 아무 일도 일어나지 않는다(refund_credits 는 0 이하를 거부한다).

select p.credits as before,
       public.refund_credits(
         u.id,
         100000 - p.credits,
         'adjustment',
         null,
         'test account top-up to 100000'
       ) as after
  from auth.users u
  join public.profiles p on p.id = u.id
 where u.email = 'sunlightsnow123@gmail.com'
   and p.credits < 100000;

-- 확인
select u.email, p.credits
  from auth.users u
  join public.profiles p on p.id = u.id
 where u.email = 'sunlightsnow123@gmail.com';
