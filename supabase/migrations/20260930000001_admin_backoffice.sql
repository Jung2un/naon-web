-- 관리자 권한은 사용자 metadata와 분리한다. 쓰기는 service_role만 허용한다.
create table public.backoffice_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.backoffice_admins enable row level security;
revoke all on public.backoffice_admins from public, anon, authenticated;
grant select, insert, update, delete on public.backoffice_admins to service_role;
create policy "service role manages administrators" on public.backoffice_admins
  for all to service_role using (true) with check (true);

-- 이메일만으로 자동 승격하지 않는다. 사용자가 확인한 기존 계정 ID까지 일치해야 한다.
insert into public.backoffice_admins(user_id)
select id from auth.users
where id = '50ec9fec-ffd6-43a9-b585-c89f14c3ddd1'
  and lower(email) = 'sunlightsnow123@gmail.com';

create table public.admin_credit_topups (
  request_id uuid primary key,
  user_id uuid references public.profiles(id) on delete set null,
  actor_id uuid references auth.users(id) on delete set null,
  user_email text not null,
  actor_email text not null,
  credits integer not null check (credits between 1 and 100000),
  amount_krw integer not null check (amount_krw between 1 and 100000000),
  depositor text not null check (char_length(depositor) between 1 and 80),
  payment_reference text not null unique check (char_length(payment_reference) between 4 and 120),
  note text not null default '' check (char_length(note) <= 300),
  balance_after integer not null,
  ledger_id uuid references public.credit_ledger(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.admin_credit_topups enable row level security;
revoke all on public.admin_credit_topups from public, anon, authenticated;
grant select, insert on public.admin_credit_topups to service_role;
create policy "service role reads topups" on public.admin_credit_topups
  for select to service_role using (true);
create policy "service role records topups" on public.admin_credit_topups
  for insert to service_role with check (true);
create index admin_credit_topups_user_created_idx on public.admin_credit_topups(user_id, created_at desc);
create index credit_ledger_created_idx on public.credit_ledger(created_at desc);

-- Edge Function이 인증한 actor만 전달한다. 사용자 JWT로 직접 호출할 권한은 없다.
create function public.admin_top_up_credits(
  p_actor_id uuid, p_user_id uuid, p_request_id uuid, p_credits integer,
  p_amount_krw integer, p_depositor text, p_payment_reference text, p_note text default ''
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  previous public.admin_credit_topups;
  result public.admin_credit_topups;
  new_balance integer;
  entry_id uuid;
  target_email text;
  operator_email text;
  ref text := lower(btrim(p_payment_reference));
begin
  if not exists(select 1 from public.backoffice_admins where user_id = p_actor_id) then
    raise exception 'ADMIN_FORBIDDEN';
  end if;
  if p_user_id is null or p_request_id is null or p_credits is null or p_credits not between 1 and 100000
    or p_amount_krw is null or p_amount_krw not between 1 and 100000000
    or p_depositor is null or char_length(btrim(p_depositor)) not between 1 and 80
    or ref is null or char_length(ref) not between 4 and 120
    or p_note is null or char_length(btrim(p_note)) > 300 then
    raise exception 'ADMIN_INVALID_INPUT';
  end if;
  -- 같은 요청의 동시 실행은 직렬화한다. 응답이 유실되어 재시도해도 기존 결과를 반환한다.
  perform pg_advisory_xact_lock(hashtextextended(p_request_id::text, 0));
  select * into previous from public.admin_credit_topups where request_id = p_request_id;
  if found then
    if previous.actor_id is distinct from p_actor_id or previous.user_id is distinct from p_user_id
      or previous.credits <> p_credits or previous.amount_krw <> p_amount_krw
      or previous.payment_reference <> ref or previous.depositor <> btrim(p_depositor)
      or previous.note <> btrim(p_note) then
      raise exception 'ADMIN_REQUEST_CONFLICT';
    end if;
    return to_jsonb(previous);
  end if;
  if exists(select 1 from public.admin_credit_topups where payment_reference = ref) then
    raise exception 'ADMIN_DUPLICATE_PAYMENT';
  end if;
  select email into target_email from auth.users where id = p_user_id;
  select email into operator_email from auth.users where id = p_actor_id;
  if target_email is null then raise exception 'ADMIN_USER_NOT_FOUND'; end if;

  update public.profiles set credits = credits + p_credits
    where id = p_user_id and credits <= 2147483647 - p_credits
    returning credits into new_balance;
  if new_balance is null then raise exception 'ADMIN_INVALID_INPUT'; end if;
  insert into public.credit_ledger(user_id, delta, balance_after, reason, memo)
    values(p_user_id, p_credits, new_balance, 'purchase', '무통장입금 확인 후 관리자 충전')
    returning id into entry_id;
  -- unique payment_reference 충돌은 위의 잔액·원장까지 함께 rollback한다.
  insert into public.admin_credit_topups(request_id, user_id, actor_id, user_email, actor_email,
    credits, amount_krw, depositor, payment_reference, note, balance_after, ledger_id)
    values(p_request_id, p_user_id, p_actor_id, target_email, operator_email,
      p_credits, p_amount_krw, btrim(p_depositor), ref, btrim(p_note), new_balance, entry_id)
    returning * into result;
  return to_jsonb(result);
end;
$$;
revoke all on function public.admin_top_up_credits(uuid,uuid,uuid,integer,integer,text,text,text) from public, anon, authenticated;
grant execute on function public.admin_top_up_credits(uuid,uuid,uuid,integer,integer,text,text,text) to service_role;

-- 모든 조회는 서비스 키를 가진 Edge Function을 통해서만, 페이지 단위로 반환한다.
create function public.admin_backoffice_read(
  p_actor_id uuid, p_operation text, p_search text default '',
  p_user_id uuid default null, p_page integer default 1, p_filter text default 'all'
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  result jsonb;
  items jsonb;
  total bigint;
  page_number integer := greatest(1, least(coalesce(p_page, 1), 100000));
  query text := left(btrim(coalesce(p_search, '')), 120);
  today date := (now() at time zone 'Asia/Seoul')::date;
begin
  if not exists(select 1 from public.backoffice_admins where user_id = p_actor_id) then
    raise exception 'ADMIN_FORBIDDEN';
  end if;
  if p_operation = 'overview' then
    select jsonb_build_object(
      'users', (select count(*) from public.profiles),
      'new_users', (select count(*) from public.profiles where created_at >= (today - 13)::timestamp at time zone 'Asia/Seoul'),
      'outstanding_credits', (select coalesce(sum(credits), 0) from public.profiles),
      'used_credits', (select coalesce(-sum(delta), 0) from public.credit_ledger where delta < 0 and created_at >= (today - 13)::timestamp at time zone 'Asia/Seoul'),
      'topup_credits', (select coalesce(sum(credits), 0) from public.admin_credit_topups where created_at >= (today - 13)::timestamp at time zone 'Asia/Seoul'),
      'deposit_krw', (select coalesce(sum(amount_krw), 0) from public.admin_credit_topups where created_at >= (today - 13)::timestamp at time zone 'Asia/Seoul'),
      'daily', (select jsonb_agg(to_jsonb(d) order by day) from (
        select to_char(day, 'YYYY-MM-DD') as day,
          coalesce(l.used, 0) as used, coalesce(t.charged, 0) as charged
        from generate_series(today - 13, today, interval '1 day') day
        left join (select (created_at at time zone 'Asia/Seoul')::date as date, -sum(delta) as used
          from public.credit_ledger where delta < 0 and created_at >= (today - 13)::timestamp at time zone 'Asia/Seoul' group by 1) l on l.date = day::date
        left join (select (created_at at time zone 'Asia/Seoul')::date as date, sum(credits) as charged
          from public.admin_credit_topups where created_at >= (today - 13)::timestamp at time zone 'Asia/Seoul' group by 1) t on t.date = day::date
      ) d)
    ) into result;
    return result;
  elsif p_operation = 'users' then
    select count(*) into total from public.profiles p join auth.users u on u.id = p.id
      where (query = '' or strpos(lower(coalesce(u.email, '')), lower(query)) > 0
        or strpos(lower(coalesce(p.display_name, '')), lower(query)) > 0 or p.id::text = query)
      and (p_filter <> 'empty' or p.credits = 0);
    page_number := least(page_number, greatest(1, ceil(total::numeric / 25)::integer));
    select coalesce(jsonb_agg(to_jsonb(t)), '[]') into items from (
      select p.id, p.display_name, u.email, p.credits, p.created_at, u.last_sign_in_at,
        exists(select 1 from public.backoffice_admins a where a.user_id = p.id) as is_admin
      from public.profiles p join auth.users u on u.id = p.id
      where (query = '' or strpos(lower(coalesce(u.email, '')), lower(query)) > 0
        or strpos(lower(coalesce(p.display_name, '')), lower(query)) > 0 or p.id::text = query)
      and (p_filter <> 'empty' or p.credits = 0)
      order by p.created_at desc, p.id limit 25 offset (page_number - 1) * 25
    ) t;
    return jsonb_build_object('items', items, 'total', total, 'page', page_number);
  elsif p_operation = 'user' then
    select jsonb_build_object('id', p.id, 'email', u.email, 'display_name', p.display_name,
      'credits', p.credits, 'created_at', p.created_at, 'last_sign_in_at', u.last_sign_in_at,
      'is_admin', exists(select 1 from public.backoffice_admins where user_id = p.id),
      'used_credits', (select coalesce(-sum(delta), 0) from public.credit_ledger where user_id = p.id and delta < 0),
      'purchased_credits', (select coalesce(sum(delta), 0) from public.credit_ledger where user_id = p.id and reason = 'purchase'),
      'refunded_credits', (select coalesce(sum(delta), 0) from public.credit_ledger where user_id = p.id and reason::text like '%_refund'),
      'characters', (select count(*) from public.characters where user_id = p.id),
      'looks', (select count(*) from public.looks where user_id = p.id),
      'jobs', (select count(*) from public.jobs where user_id = p.id))
      into result from public.profiles p join auth.users u on u.id = p.id where p.id = p_user_id;
    if result is null then raise exception 'ADMIN_USER_NOT_FOUND'; end if;
    return result;
  elsif p_operation = 'ledger' then
    select count(*) into total from public.credit_ledger
      where user_id = p_user_id and (p_filter = 'all' or (p_filter = 'used' and delta < 0)
        or (p_filter = 'charged' and reason = 'purchase') or (p_filter = 'refunded' and reason::text like '%_refund'));
    page_number := least(page_number, greatest(1, ceil(total::numeric / 25)::integer));
    select coalesce(jsonb_agg(to_jsonb(t)), '[]') into items from (
      select id, delta, balance_after, reason, memo, job_id, created_at from public.credit_ledger
      where user_id = p_user_id and (p_filter = 'all' or (p_filter = 'used' and delta < 0)
        or (p_filter = 'charged' and reason = 'purchase') or (p_filter = 'refunded' and reason::text like '%_refund'))
      order by created_at desc, id desc limit 25 offset (page_number - 1) * 25
    ) t;
    return jsonb_build_object('items', items, 'total', total, 'page', page_number);
  elsif p_operation = 'topups' then
    select count(*) into total from public.admin_credit_topups where p_user_id is null or user_id = p_user_id;
    page_number := least(page_number, greatest(1, ceil(total::numeric / 25)::integer));
    select coalesce(jsonb_agg(to_jsonb(t)), '[]') into items from (
      select * from public.admin_credit_topups where p_user_id is null or user_id = p_user_id
      order by created_at desc, request_id desc limit 25 offset (page_number - 1) * 25
    ) t;
    return jsonb_build_object('items', items, 'total', total, 'page', page_number);
  end if;
  raise exception 'ADMIN_INVALID_INPUT';
end;
$$;
revoke all on function public.admin_backoffice_read(uuid,text,text,uuid,integer,text) from public, anon, authenticated;
grant execute on function public.admin_backoffice_read(uuid,text,text,uuid,integer,text) to service_role;
