-- Atomic job reservation and terminal settlement. Existing data and policies remain.
alter table public.jobs add column if not exists provider_request_id text;
alter table public.jobs add column if not exists provider_model text;

create or replace function public.begin_video_job(p_user_id uuid, p_id uuid, p_character_id uuid, p_look_id uuid, p_source_path text, p_duration numeric, p_model text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_job public.jobs; v_balance integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_id::text, 0));
  select * into v_job from public.jobs where id = p_id;
  if found then
    if v_job.user_id <> p_user_id or v_job.source_video_path is distinct from p_source_path
       or v_job.character_id <> p_character_id or v_job.look_id is distinct from p_look_id then
      raise exception 'VIDEO_INVALID';
    end if;
    return false;
  end if;
  if p_source_path <> p_user_id::text || '/' || p_id::text || '/source.mp4' or p_duration not between 3 and 10 then raise exception 'VIDEO_INVALID'; end if;
  if not exists(select 1 from public.characters where id=p_character_id and user_id=p_user_id and stage='ready' and status='done') then raise exception 'CHARACTER_NOT_READY'; end if;
  if p_look_id is not null and not exists(select 1 from public.looks where id=p_look_id and user_id=p_user_id and character_id=p_character_id and status='done') then raise exception 'LOOK_INCOMPLETE'; end if;
  -- Serialize a user's reservations with credit changes; cap simultaneous expensive jobs.
  perform 1 from public.profiles where id=p_user_id for update;
  if (select count(*) from public.jobs where user_id=p_user_id and status in ('queued','processing')) >= 2 then raise exception 'VIDEO_BUSY'; end if;
  update public.profiles set credits=credits-1 where id=p_user_id and credits>=1 returning credits into v_balance;
  if v_balance is null then raise exception 'INSUFFICIENT_CREDITS'; end if;
  insert into public.jobs(id,user_id,character_id,look_id,source_video_path,duration_seconds,credits_spent,provider_model)
  values(p_id,p_user_id,p_character_id,p_look_id,p_source_path,p_duration,1,p_model);
  insert into public.credit_ledger(user_id,delta,balance_after,reason,job_id,memo)
  values(p_user_id,-1,v_balance,'job_charge',p_id,'job:'||p_id);
  return true;
end; $$;

create or replace function public.finish_video_job(p_id uuid, p_result_path text default null, p_error text default null)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_job public.jobs; v_balance integer;
begin
  select * into v_job from public.jobs where id=p_id for update;
  if not found or v_job.status not in ('queued','processing') then return false; end if;
  if p_result_path is not null and p_error is null then
    if p_result_path not like v_job.user_id::text || '/' || p_id::text || '/result.%' then raise exception 'Invalid output path'; end if;
    update public.jobs set status='done',result_video_path=p_result_path,error_code=null,completed_at=now() where id=p_id;
  elsif p_error is not null then
    update public.jobs set status='failed',error_code=p_error,completed_at=now() where id=p_id;
    update public.profiles set credits=credits+v_job.credits_spent where id=v_job.user_id returning credits into v_balance;
    insert into public.credit_ledger(user_id,delta,balance_after,reason,job_id,memo)
    values(v_job.user_id,v_job.credits_spent,v_balance,'job_refund',p_id,'job:'||p_id);
  else raise exception 'Missing result'; end if;
  return true;
end; $$;
revoke all on function public.begin_video_job(uuid,uuid,uuid,uuid,text,numeric,text) from public,anon,authenticated;
revoke all on function public.finish_video_job(uuid,text,text) from public,anon,authenticated;
grant execute on function public.begin_video_job(uuid,uuid,uuid,uuid,text,numeric,text) to service_role;
grant execute on function public.finish_video_job(uuid,text,text) to service_role;
