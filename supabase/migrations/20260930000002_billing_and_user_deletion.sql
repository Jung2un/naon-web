create table public.billing_settings (
  id boolean primary key default true check (id),
  settings jsonb not null default '{"enabled":false,"bank_name":"","account_number":"","account_holder":"","instructions":"입금 후 운영자가 확인하면 크레딧을 지급해 드립니다.","plans":[]}',
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
alter table public.billing_settings enable row level security;
revoke all on public.billing_settings from public, anon, authenticated;
grant all on public.billing_settings to service_role;
create policy "service role manages billing" on public.billing_settings for all to service_role using(true) with check(true);
insert into public.billing_settings(id) values(true);

create function public.get_public_billing() returns jsonb language sql stable security definer set search_path = '' as $$
  select case when settings->>'enabled' = 'true' then settings else null end from public.billing_settings where id;
$$;
revoke all on function public.get_public_billing() from public, anon;
grant execute on function public.get_public_billing() to authenticated;

create function public.admin_billing(p_actor_id uuid, p_settings jsonb default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare plan jsonb; result jsonb;
begin
  if not exists(select 1 from public.backoffice_admins where user_id = p_actor_id) then raise exception 'ADMIN_FORBIDDEN'; end if;
  if p_settings is not null then
    if jsonb_typeof(p_settings) <> 'object' or jsonb_typeof(p_settings->'enabled') is distinct from 'boolean'
      or jsonb_typeof(p_settings->'plans') is distinct from 'array'
      or jsonb_typeof(p_settings->'bank_name') is distinct from 'string'
      or jsonb_typeof(p_settings->'account_number') is distinct from 'string'
      or jsonb_typeof(p_settings->'account_holder') is distinct from 'string'
      or jsonb_typeof(p_settings->'instructions') is distinct from 'string' then raise exception 'ADMIN_INVALID_INPUT'; end if;
    if char_length(p_settings->>'bank_name') > 40 or char_length(p_settings->>'account_number') > 60
      or char_length(p_settings->>'account_holder') > 80 or char_length(p_settings->>'instructions') > 1000
      or jsonb_array_length(p_settings->'plans') > 6 then raise exception 'ADMIN_INVALID_INPUT'; end if;
    if (p_settings->>'enabled')::boolean and (btrim(p_settings->>'bank_name') = '' or btrim(p_settings->>'account_number') = ''
      or btrim(p_settings->>'account_holder') = '' or jsonb_array_length(p_settings->'plans') = 0) then raise exception 'ADMIN_INVALID_INPUT'; end if;
    for plan in select value from jsonb_array_elements(p_settings->'plans') loop
      if jsonb_typeof(plan->'name') is distinct from 'string' or char_length(btrim(plan->>'name')) not between 1 and 40
        or jsonb_typeof(plan->'credits') is distinct from 'number' or jsonb_typeof(plan->'price_krw') is distinct from 'number'
        or (plan->>'credits')::numeric not between 1 and 100000 or (plan->>'price_krw')::numeric not between 1 and 100000000
        or (plan->>'credits')::numeric <> trunc((plan->>'credits')::numeric)
        or (plan->>'price_krw')::numeric <> trunc((plan->>'price_krw')::numeric) then raise exception 'ADMIN_INVALID_INPUT'; end if;
    end loop;
    update public.billing_settings set settings = p_settings, updated_by = p_actor_id, updated_at = now() where id;
  end if;
  select settings into result from public.billing_settings where id;
  return result;
end;
$$;
revoke all on function public.admin_billing(uuid,jsonb) from public, anon, authenticated;
grant execute on function public.admin_billing(uuid,jsonb) to service_role;

-- 사용자 삭제는 기록 보존형이다. 크레딧 원장과 이미 완료한 작업물의 연결은 유지한다.
alter table public.characters add column deleted_at timestamptz;
alter table public.jobs add column deleted_at timestamptz;
create policy "hide deleted characters" on public.characters as restrictive for all to authenticated
  using(deleted_at is null) with check(deleted_at is null);
create policy "hide deleted jobs" on public.jobs as restrictive for all to authenticated
  using(deleted_at is null) with check(deleted_at is null);
revoke delete on public.characters, public.jobs from anon, authenticated;

create function public.guard_deleted_at() returns trigger language plpgsql set search_path = '' as $$
begin
  if current_user in ('anon', 'authenticated') and new.deleted_at is distinct from old.deleted_at then
    raise exception 'DELETE_FORBIDDEN';
  end if;
  if old.deleted_at is not null then raise exception 'DELETE_NOT_FOUND'; end if;
  return new;
end;
$$;
create trigger characters_guard_deleted_at before update on public.characters for each row execute function public.guard_deleted_at();
create trigger jobs_guard_deleted_at before update on public.jobs for each row execute function public.guard_deleted_at();

create function public.delete_owned_item(p_kind text, p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare caller uuid := auth.uid(); item_status public.job_status;
begin
  if caller is null then raise exception 'SESSION_EXPIRED'; end if;
  if p_kind = 'job' then
    select status into item_status from public.jobs where id = p_id and user_id = caller and deleted_at is null for update;
    if not found then raise exception 'DELETE_NOT_FOUND'; end if;
    if item_status in ('queued', 'processing') then raise exception 'DELETE_BUSY'; end if;
    update public.jobs set deleted_at = now() where id = p_id;
  elsif p_kind = 'character' then
    select status into item_status from public.characters where id = p_id and user_id = caller and deleted_at is null for update;
    if not found then raise exception 'DELETE_NOT_FOUND'; end if;
    if item_status in ('queued', 'processing')
      or exists(select 1 from public.jobs where character_id = p_id and status in ('queued', 'processing'))
      or exists(select 1 from public.looks where character_id = p_id and status in ('queued', 'processing')) then
      raise exception 'DELETE_BUSY';
    end if;
    update public.characters set deleted_at = now() where id = p_id;
  else raise exception 'DELETE_NOT_FOUND'; end if;
end;
$$;
revoke all on function public.delete_owned_item(text,uuid) from public, anon;
grant execute on function public.delete_owned_item(text,uuid) to authenticated;

-- 생성 시작과 삭제가 경쟁하더라도 삭제된 캐릭터에 새 작업을 만들 수 없다.
create function public.guard_active_character() returns trigger language plpgsql security definer set search_path = '' as $$
declare removed timestamptz;
begin
  select deleted_at into removed from public.characters where id = new.character_id for share;
  if not found or removed is not null then raise exception 'CHARACTER_NOT_FOUND'; end if;
  return new;
end;
$$;
create trigger jobs_require_active_character before insert on public.jobs for each row execute function public.guard_active_character();
create trigger looks_require_active_character before insert on public.looks for each row execute function public.guard_active_character();
create trigger images_require_active_character before insert on public.character_images for each row execute function public.guard_active_character();
