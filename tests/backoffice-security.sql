-- Run in one transaction after migrations. This file ALWAYS rolls test data back.
-- Target accounts below are disposable test fixtures, never real users.
insert into auth.users(id, email) values ('90000000-0000-4000-8000-000000000001', 'backoffice-rollback-test@example.invalid');

do $$
declare a uuid := '50ec9fec-ffd6-43a9-b585-c89f14c3ddd1';
  u uuid := '90000000-0000-4000-8000-000000000001';
  r uuid := '90000000-0000-4000-8000-000000000002';
  result jsonb; again jsonb; settings jsonb;
begin
  if has_function_privilege('authenticated', 'public.admin_top_up_credits(uuid,uuid,uuid,integer,integer,text,text,text)', 'execute')
    or has_function_privilege('anon', 'public.admin_backoffice_read(uuid,text,text,uuid,integer,text)', 'execute')
    or has_table_privilege('authenticated', 'public.backoffice_admins', 'insert')
    or has_table_privilege('authenticated', 'public.admin_credit_topups', 'select') then raise exception 'Security grants exposed'; end if;
  begin perform public.admin_backoffice_read(u, 'overview'); raise exception 'Non-admin read allowed';
    exception when others then if sqlerrm <> 'ADMIN_FORBIDDEN' then raise; end if; end;
  begin perform public.admin_top_up_credits(u, u, r, 123, 10000, 'Tester', 'rollback-transaction', ''); raise exception 'Non-admin write allowed';
    exception when others then if sqlerrm <> 'ADMIN_FORBIDDEN' then raise; end if; end;
  result := public.admin_top_up_credits(a, u, r, 123, 10000, 'Tester', 'rollback-transaction', '');
  again := public.admin_top_up_credits(a, u, r, 123, 10000, 'Tester', 'rollback-transaction', '');
  if result <> again or (select credits from public.profiles where id = u) <> 138 then raise exception 'Idempotency failure'; end if;
  if (select count(*) from public.credit_ledger where user_id = u and reason = 'purchase') <> 1 then raise exception 'Duplicate ledger'; end if;
  begin perform public.admin_top_up_credits(a, u, r, 124, 10000, 'Tester', 'rollback-transaction', ''); raise exception 'Changed retry allowed';
    exception when others then if sqlerrm <> 'ADMIN_REQUEST_CONFLICT' then raise; end if; end;
  begin perform public.admin_top_up_credits(a, u, gen_random_uuid(), 123, 10000, 'Tester', 'ROLLBACK-TRANSACTION', ''); raise exception 'Duplicate payment allowed';
    exception when others then if sqlerrm <> 'ADMIN_DUPLICATE_PAYMENT' then raise; end if; end;
  begin perform public.admin_top_up_credits(a, u, gen_random_uuid(), -1, 10000, 'Tester', 'rollback-invalid', ''); raise exception 'Negative topup allowed';
    exception when others then if sqlerrm <> 'ADMIN_INVALID_INPUT' then raise; end if; end;
  if jsonb_array_length(public.admin_backoffice_read(a, 'overview')->'daily') <> 14 then raise exception 'Daily chart wrong'; end if;
  if (public.admin_backoffice_read(a, 'users', 'backoffice-rollback-test@example.invalid')->>'total')::int <> 1 then raise exception 'Search wrong'; end if;
  if (public.admin_backoffice_read(a, 'user', '', u)->>'purchased_credits')::int <> 123 then raise exception 'User totals wrong'; end if;
  if (public.admin_backoffice_read(a, 'ledger', '', u, 1, 'charged')->>'total')::int <> 1 then raise exception 'Ledger filter wrong'; end if;
  if public.get_public_billing() is not null then raise exception 'Draft billing exposed'; end if;
  settings := '{"enabled":true,"bank_name":"Test","account_number":"123","account_holder":"Tester","instructions":"Test only","plans":[{"name":"Test","credits":10,"price_krw":1000}]}';
  perform public.admin_billing(a, settings);
  if public.get_public_billing() <> settings then raise exception 'Published billing missing'; end if;
  begin perform public.admin_billing(u, settings); raise exception 'Non-admin settings allowed';
    exception when others then if sqlerrm <> 'ADMIN_FORBIDDEN' then raise; end if; end;
  begin perform public.admin_billing(a, jsonb_set(settings, '{plans,0,credits}', '-5')); raise exception 'Invalid pricing allowed';
    exception when others then if sqlerrm <> 'ADMIN_INVALID_INPUT' then raise; end if; end;
end;
$$;

insert into public.characters(id,user_id,name,status) values ('90000000-0000-4000-8000-000000000003','90000000-0000-4000-8000-000000000001','Deletion test','done');
insert into public.jobs(id,user_id,character_id,status) values ('90000000-0000-4000-8000-000000000004','90000000-0000-4000-8000-000000000001','90000000-0000-4000-8000-000000000003','processing');
set local request.jwt.claim.sub = '50ec9fec-ffd6-43a9-b585-c89f14c3ddd1';
set local role authenticated;
do $$ begin
  begin perform public.delete_owned_item('character', '90000000-0000-4000-8000-000000000003'); raise exception 'Other owner delete allowed';
    exception when others then if sqlerrm <> 'DELETE_NOT_FOUND' then raise; end if; end;
  begin perform public.admin_backoffice_read('50ec9fec-ffd6-43a9-b585-c89f14c3ddd1','overview'); raise exception 'RPC accessible to client';
    exception when insufficient_privilege then null; end;
end; $$;
reset role;
set local request.jwt.claim.sub = '90000000-0000-4000-8000-000000000001';
set local role authenticated;
do $$ begin
  begin perform public.delete_owned_item('job', '90000000-0000-4000-8000-000000000004'); raise exception 'Running job deleted';
    exception when others then if sqlerrm <> 'DELETE_BUSY' then raise; end if; end;
  begin perform public.delete_owned_item('character', '90000000-0000-4000-8000-000000000003'); raise exception 'Busy character deleted';
    exception when others then if sqlerrm <> 'DELETE_BUSY' then raise; end if; end;
  begin update public.characters set deleted_at = now() where id = '90000000-0000-4000-8000-000000000003'; raise exception 'Direct delete bypass allowed';
    exception when others then if sqlerrm <> 'DELETE_FORBIDDEN' then raise; end if; end;
end; $$;
reset role;
update public.jobs set status = 'done' where id = '90000000-0000-4000-8000-000000000004';
set local role authenticated;
select public.delete_owned_item('character', '90000000-0000-4000-8000-000000000003');
do $$ begin
  if exists(select 1 from public.characters where id = '90000000-0000-4000-8000-000000000003') then raise exception 'Deleted character visible'; end if;
  if not exists(select 1 from public.jobs where id = '90000000-0000-4000-8000-000000000004') then raise exception 'Existing job lost'; end if;
end; $$;
select public.delete_owned_item('job', '90000000-0000-4000-8000-000000000004');
do $$ begin
  if exists(select 1 from public.jobs where id = '90000000-0000-4000-8000-000000000004') then raise exception 'Deleted job visible'; end if;
end; $$;
reset role;
do $$ begin
  if (select count(*) from public.credit_ledger where user_id = '90000000-0000-4000-8000-000000000001') <> 2 then raise exception 'Ledger lost'; end if;
  begin insert into public.jobs(user_id, character_id) values ('90000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-000000000003'); raise exception 'Deleted character reused';
    exception when others then if sqlerrm <> 'CHARACTER_NOT_FOUND' then raise; end if; end;
end; $$;
select 'PASS: admin authorization, grants, atomic topups, retries, duplicate payments, validation, reporting, billing visibility, owner-only deletion, active-work protection, RLS and ledger retention' as result;

-- Pagination uses stable ordering, retains search and clamps stale page URLs.
insert into auth.users(id, email)
select ('91000000-0000-4000-8000-' || lpad(i::text,12,'0'))::uuid, 'pagination-' || i || '@example.invalid'
from generate_series(1,56) i;
do $$
declare a uuid := '50ec9fec-ffd6-43a9-b585-c89f14c3ddd1'; first_page jsonb; second_page jsonb; last_page jsonb;
begin
  first_page := public.admin_backoffice_read(a,'users','pagination-',null,1);
  second_page := public.admin_backoffice_read(a,'users','pagination-',null,2);
  last_page := public.admin_backoffice_read(a,'users','pagination-',null,999);
  if (first_page->>'total')::int <> 56 or jsonb_array_length(first_page->'items') <> 25
     or jsonb_array_length(second_page->'items') <> 25 or jsonb_array_length(last_page->'items') <> 6
     or (last_page->>'page')::int <> 3 then raise exception 'Pagination boundaries wrong'; end if;
  if exists(select 1 from jsonb_array_elements(first_page->'items') f join jsonb_array_elements(second_page->'items') s on f->>'id'=s->>'id') then raise exception 'Overlapping pages'; end if;
  if (public.admin_backoffice_read(a,'users','missing-search-result',null,999)->>'page')::int <> 1 then raise exception 'Empty page not clamped'; end if;
end; $$;
select 'PASS: paginated user search, stable ordering and page boundaries' as result;

rollback;
