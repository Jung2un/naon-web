-- AI 대역 — 초기 스키마
--
-- RLS 없는 테이블을 만들지 않는다. 테이블을 만들면 같은 파일에 정책도 같이 쓴다.
--   — CLAUDE.md 아키텍처 규칙 3
--
-- 돈이 움직이거나 GPU가 도는 행위는 클라이언트가 직접 INSERT 하지 않는다.
-- 클라이언트 키(anon)로는 SELECT와 본인 소유 row의 제한된 UPDATE/DELETE만 가능하다.
-- characters / looks / jobs INSERT와 profiles.credits 변경은 service_role(Edge Function)만.
--   — CLAUDE.md 아키텍처 규칙 2

-- ---------------------------------------------------------------- 타입

create type public.job_status as enum ('queued', 'processing', 'done', 'failed');
create type public.ref_angle as enum ('front', 'left45', 'right45', 'left90', 'right90');
create type public.preset_slot as enum ('hair', 'top', 'bottom', 'scene');
create type public.ledger_reason as enum (
  'signup_bonus', 'job_charge', 'job_refund', 'purchase', 'adjustment'
);

-- ---------------------------------------------------------------- profiles

create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url   text,
  credits      integer not null default 15 check (credits >= 0),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "본인 프로필만 읽는다"
  on public.profiles for select
  using (auth.uid() = id);

-- credits는 여기서 못 바꾼다. Edge Function(service_role)만 손댄다.
create policy "본인 프로필의 표시 정보만 고친다"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- service_role은 RLS를 우회하지만 트리거는 우회하지 못하므로,
-- 세션 롤이 authenticated일 때만 막는다.
create or replace function public.guard_profile_credits_if_client()
returns trigger
language plpgsql
as $$
begin
  if current_setting('request.jwt.claim.role', true) = 'authenticated'
     and new.credits is distinct from old.credits then
    raise exception '크레딧은 Edge Function에서만 바꿀 수 있습니다';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_guard_credits
  before update on public.profiles
  for each row execute function public.guard_profile_credits_if_client();

-- 가입하면 프로필이 자동으로 생긴다
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  );

  insert into public.credit_ledger (user_id, delta, balance_after, reason)
  values (new.id, 15, 15, 'signup_bonus');

  return new;
end;
$$;

-- ---------------------------------------------------------------- characters

create table public.characters (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  name           text not null check (char_length(name) between 1 and 20),
  status         public.job_status not null default 'queued',
  thumbnail_path text,
  error_code     text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index characters_user_created_idx
  on public.characters (user_id, created_at desc);

alter table public.characters enable row level security;

create policy "본인 캐릭터만 읽는다"
  on public.characters for select
  using (auth.uid() = user_id);

-- INSERT 정책이 없다 = 클라이언트는 만들 수 없다. Edge Function만 만든다.
create policy "본인 캐릭터의 이름만 고친다"
  on public.characters for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "본인 캐릭터를 지운다"
  on public.characters for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------- character_refs

create table public.character_refs (
  id           uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.characters (id) on delete cascade,
  angle        public.ref_angle not null,
  image_path   text not null,
  created_at   timestamptz not null default now(),
  unique (character_id, angle)
);

alter table public.character_refs enable row level security;

create policy "본인 캐릭터의 레퍼런스만 읽는다"
  on public.character_refs for select
  using (
    exists (
      select 1 from public.characters c
      where c.id = character_refs.character_id and c.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------- presets

create table public.presets (
  id             uuid primary key default gen_random_uuid(),
  slot           public.preset_slot not null,
  name           text not null,
  description    text,
  thumbnail_path text,
  sort_order     integer not null default 0,
  is_active      boolean not null default true
);

create index presets_slot_order_idx on public.presets (slot, sort_order);

alter table public.presets enable row level security;

-- 프리셋은 모두가 공유하는 카탈로그다. 읽기만 열어 둔다.
create policy "로그인한 사용자는 활성 프리셋을 읽는다"
  on public.presets for select
  to authenticated
  using (is_active);

-- ---------------------------------------------------------------- looks

create table public.looks (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  character_id     uuid not null references public.characters (id) on delete cascade,
  name             text not null check (char_length(name) between 1 and 40),
  hair_preset_id   uuid not null references public.presets (id),
  top_preset_id    uuid not null references public.presets (id),
  bottom_preset_id uuid not null references public.presets (id),
  scene_preset_id  uuid not null references public.presets (id),
  status           public.job_status not null default 'queued',
  thumbnail_path   text,
  is_adopted       boolean not null default false,
  error_code       text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index looks_user_created_idx on public.looks (user_id, created_at desc);
create index looks_character_idx on public.looks (character_id);

-- 캐릭터당 채택 룩은 하나
create unique index looks_one_adopted_per_character
  on public.looks (character_id) where is_adopted;

alter table public.looks enable row level security;

create policy "본인 룩만 읽는다"
  on public.looks for select
  using (auth.uid() = user_id);

create policy "본인 룩의 이름과 채택 여부만 고친다"
  on public.looks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "본인 룩을 지운다"
  on public.looks for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------- jobs

create table public.jobs (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  character_id      uuid not null references public.characters (id) on delete cascade,
  look_id           uuid references public.looks (id) on delete set null,
  status            public.job_status not null default 'queued',
  source_video_path text,
  result_video_path text,
  thumbnail_path    text,
  duration_seconds  numeric(5, 2),
  credits_spent     integer not null default 0,
  error_code        text,
  created_at        timestamptz not null default now(),
  started_at        timestamptz,
  completed_at      timestamptz
);

create index jobs_user_created_idx on public.jobs (user_id, created_at desc);
create index jobs_character_idx on public.jobs (character_id);

alter table public.jobs enable row level security;

create policy "본인 작업물만 읽는다"
  on public.jobs for select
  using (auth.uid() = user_id);

create policy "본인 작업물을 지운다"
  on public.jobs for delete
  using (auth.uid() = user_id);

-- 웹은 Realtime으로 상태만 받는다
alter publication supabase_realtime add table public.jobs;

-- ---------------------------------------------------------------- credit_ledger

create table public.credit_ledger (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  delta         integer not null,
  balance_after integer not null,
  reason        public.ledger_reason not null,
  job_id        uuid references public.jobs (id) on delete set null,
  memo          text,
  created_at    timestamptz not null default now()
);

create index credit_ledger_user_created_idx
  on public.credit_ledger (user_id, created_at desc);

alter table public.credit_ledger enable row level security;

-- 읽기만. 쓰기는 Edge Function(service_role)만 한다.
create policy "본인 사용 내역만 읽는다"
  on public.credit_ledger for select
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------- 가입 트리거

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------- 스토리지

insert into storage.buckets (id, name, public)
values
  ('characters', 'characters', false),
  ('looks',      'looks',      false),
  ('videos',     'videos',     false),
  ('presets',    'presets',    false)
on conflict (id) do nothing;

-- private 버킷이다. 읽기는 서버가 만든 signed URL로만 나간다. — 아키텍처 규칙 4
-- 업로드는 본인 폴더(<uid>/…)에만 허용한다.
create policy "본인 폴더에만 올린다"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id in ('characters', 'looks', 'videos')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "본인 폴더만 읽는다"
  on storage.objects for select
  to authenticated
  using (
    bucket_id in ('characters', 'looks', 'videos')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "본인 폴더만 지운다"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id in ('characters', 'looks', 'videos')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "프리셋 썸네일은 로그인하면 읽는다"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'presets');
