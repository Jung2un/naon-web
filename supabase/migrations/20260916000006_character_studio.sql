-- 캐릭터 스튜디오 — 톤을 골라 뽑고, 다듬고, 3방향을 자동으로 만든다. — docs/기획서.md
--
-- 추가만 한다. 기존 컬럼은 하나도 지우지 않는다. — docs/배포.md §10
-- `character_refs`와 `ref_angle`은 그대로 쓴다. 4단계가 끝나면 3방향이 거기 들어가고,
-- 캐릭터 상세 화면은 지금 쓰던 쿼리를 그대로 읽는다.
--
-- RLS 없는 테이블을 만들지 않는다. — CLAUDE.md 아키텍처 규칙 3
-- 클라이언트는 여기 어느 테이블에도 INSERT 하지 않는다. — CLAUDE.md 아키텍처 규칙 2

-- ---------------------------------------------------------------- 타입

-- 어디까지 왔나. status(진행 중인 생성이 어떤가)와는 다른 질문이다. — 기획서 §5
create type public.character_stage as enum ('draft', 'refining', 'building', 'ready');

-- 생성된 이미지 한 장의 성격
create type public.character_image_kind as enum ('candidate', 'refined', 'view');

-- 톤·속성 카탈로그의 갈래
create type public.character_option_kind as enum (
  'tone', 'gender', 'age', 'hair', 'hair_color', 'body', 'vibe'
);

-- ---------------------------------------------------------------- character_options

-- 프리셋과 같은 성격이다 — 사용자가 만드는 데이터가 아니라 모두가 공유하는 카탈로그.
-- 다른 점은 `prompt`가 같은 행에 있다는 것이다. 문구를 손보는 데 배포가 필요 없다.
create table public.character_options (
  id             uuid primary key default gen_random_uuid(),
  kind           public.character_option_kind not null,
  name           text not null,
  description    text,
  prompt         text not null,
  thumbnail_path text,
  sort_order     integer not null default 0,
  is_active      boolean not null default true
);

create index character_options_kind_order_idx
  on public.character_options (kind, sort_order);

alter table public.character_options enable row level security;

create policy "로그인한 사용자는 활성 옵션을 읽는다"
  on public.character_options for select
  to authenticated
  using (is_active);

-- ---------------------------------------------------------------- characters 확장

-- 기존 행은 이미 완성된 캐릭터라 stage 기본값이 ready여야 한다.
alter table public.characters
  add column if not exists stage           public.character_stage not null default 'ready',
  add column if not exists tone_id         uuid references public.character_options (id),
  add column if not exists traits          jsonb not null default '{}'::jsonb,
  add column if not exists base_image_path text;

comment on column public.characters.base_image_path is
  '지금 이 캐릭터의 얼굴. 후보를 고르거나 수정이 끝나면 바뀐다. 룩과 3방향의 입력이다.';

create index characters_user_stage_idx on public.characters (user_id, stage);

-- ---------------------------------------------------------------- character_images

-- GPU가 도는 단위가 이 행이다. fal 웹훅이 행 하나에 결과 하나를 꽂는다.
-- (character_id, kind, round)가 한 배치 — 후보 4장, 수정 1장, 3방향 3장.
create table public.character_images (
  id                uuid primary key default gen_random_uuid(),
  character_id      uuid not null references public.characters (id) on delete cascade,
  kind              public.character_image_kind not null,
  angle             public.ref_angle,
  round             integer not null default 1,
  -- 이 배치가 노린 속성. 수정이 성공했을 때만 characters.traits로 옮겨진다 —
  -- 실패한 수정의 속성이 캐릭터에 남으면 화면이 없는 머리 모양을 말하게 된다.
  traits            jsonb not null default '{}'::jsonb,
  source_image_path text,
  image_path        text,
  status            public.job_status not null default 'queued',
  error_code        text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  -- 각도는 최종 3방향에만 있다. 후보·수정본에 각도가 붙으면 배치 계산이 어긋난다.
  constraint character_images_angle_only_for_view
    check ((kind = 'view') = (angle is not null))
);

create index character_images_batch_idx
  on public.character_images (character_id, kind, round);

alter table public.character_images enable row level security;

create policy "본인 캐릭터의 이미지만 읽는다"
  on public.character_images for select
  using (
    exists (
      select 1 from public.characters c
      where c.id = character_images.character_id and c.user_id = auth.uid()
    )
  );

-- INSERT/UPDATE 정책이 없다 = 클라이언트는 만들지도 고치지도 못한다. Edge Function만 한다.

-- ---------------------------------------------------------------- Realtime

-- 뽑는 데 30초~3분이 걸린다. 웹은 상태만 받아서 서버 컴포넌트를 다시 그린다.
alter publication supabase_realtime add table public.characters;
alter publication supabase_realtime add table public.character_images;

-- ---------------------------------------------------------------- 후보 고르기 · 되돌리기

-- 돈도 GPU도 안 쓰는 행위라 Edge Function이 아니다. — 기획서 §6
-- 대신 남의 이미지를 고를 수 없게 함수 안에서 소유권을 확인한다.
--
-- 예외로 던지지 않고 코드를 돌려준다. 호출부가 문자열을 비교하지 않게 하려는 것이다.
--   ok        고쳤다
--   busy      지금 뭔가 뽑는 중이라 못 바꾼다
--   not_found 내 것이 아니거나, 아직 완성되지 않은 이미지다
create or replace function public.select_character_image(
  p_character_id uuid,
  p_image_id     uuid
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_path  text;
  v_stage public.character_stage;
  v_status public.job_status;
begin
  select c.stage, c.status into v_stage, v_status
  from public.characters c
  where c.id = p_character_id and c.user_id = auth.uid();

  if v_stage is null then return 'not_found'; end if;
  if v_status = 'processing' then return 'busy'; end if;
  if v_stage not in ('draft', 'refining') then return 'not_found'; end if;

  select ci.image_path into v_path
  from public.character_images ci
  where ci.id = p_image_id
    and ci.character_id = p_character_id
    and ci.status = 'done'
    and ci.image_path is not null
    and ci.kind in ('candidate', 'refined');

  if v_path is null then return 'not_found'; end if;

  update public.characters
     set base_image_path = v_path,
         thumbnail_path  = v_path,
         stage           = 'refining',
         status          = 'done',
         error_code      = null,
         updated_at      = now()
   where id = p_character_id and user_id = auth.uid();

  return 'ok';
end;
$$;

-- ---------------------------------------------------------------- 배치 끝내기

-- 웹훅은 이미지 한 장마다 온다. 4장짜리 배치면 네 번 온다.
-- 배치를 끝내는 판단(상태 전이·환불 여부)은 여기 한 곳에서만 한다.
--
-- 마지막 두 장이 동시에 도착해도 캐릭터 행의 상태 전이가 조건부(status='processing')라
-- 한쪽만 이긴다. 진 쪽은 'already'를 받고 아무것도 하지 않는다 — 이중 환불을 막는 장치가 이것이다.
--
--   pending  아직 안 끝난 장이 있다
--   done     배치 성공. 환불 없음
--   failed   배치 실패. 호출부가 환불한다
--   already  이미 누가 끝냈다. 환불 없음
create or replace function public.finish_character_batch(
  p_character_id uuid,
  p_kind         public.character_image_kind,
  p_round        integer
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pending integer;
  v_done    integer;
  v_total   integer;
  v_ok      boolean;
  v_path    text;
  v_traits  jsonb;
begin
  select count(*) filter (where status in ('queued', 'processing')),
         count(*) filter (where status = 'done'),
         count(*)
    into v_pending, v_done, v_total
  from public.character_images
  where character_id = p_character_id and kind = p_kind and round = p_round;

  if v_pending > 0 then return 'pending'; end if;

  -- 3방향은 셋이 다 있어야 캐릭터가 성립한다. 후보는 한 장만 나와도 고를 수 있다. — 기획서 §4
  if p_kind = 'view' then
    v_ok := (v_total > 0 and v_done = v_total);
  else
    v_ok := (v_done > 0);
  end if;

  if not v_ok then
    update public.characters
       set status     = 'failed',
           error_code = 'UPSTREAM_ERROR',
           -- 3방향이 실패해도 다듬던 얼굴은 그대로 남는다. 다시 완성하기를 누르면 된다.
           stage      = case when p_kind = 'view' then 'refining'::public.character_stage else stage end,
           updated_at = now()
     where id = p_character_id and status = 'processing';

    if not found then return 'already'; end if;
    return 'failed';
  end if;

  if p_kind = 'view' then
    insert into public.character_refs (character_id, angle, image_path)
    select character_id, angle, image_path
    from public.character_images
    where character_id = p_character_id
      and kind = 'view' and round = p_round and status = 'done'
    on conflict (character_id, angle) do update set image_path = excluded.image_path;

    select image_path into v_path
    from public.character_images
    where character_id = p_character_id
      and kind = 'view' and round = p_round and angle = 'front' and status = 'done';

    update public.characters
       set status         = 'done',
           stage          = 'ready',
           error_code     = null,
           thumbnail_path = coalesce(v_path, thumbnail_path),
           updated_at     = now()
     where id = p_character_id and status = 'processing';

  elsif p_kind = 'refined' then
    -- 수정본은 한 장이다. 끝나면 그게 지금 얼굴이 된다. 되돌리기는 select_character_image가 한다.
    select image_path, traits into v_path, v_traits
    from public.character_images
    where character_id = p_character_id
      and kind = 'refined' and round = p_round and status = 'done'
    limit 1;

    update public.characters
       set status          = 'done',
           error_code      = null,
           base_image_path = coalesce(v_path, base_image_path),
           thumbnail_path  = coalesce(v_path, thumbnail_path),
           -- 성공했을 때만 속성을 옮긴다. 실패하면 화면은 이전 속성 그대로다.
           traits          = coalesce(v_traits, traits),
           updated_at      = now()
     where id = p_character_id and status = 'processing';

  else
    -- 후보는 사람이 고를 때까지 stage가 draft에 머문다.
    update public.characters
       set status     = 'done',
           error_code = null,
           updated_at = now()
     where id = p_character_id and status = 'processing';
  end if;

  if not found then return 'already'; end if;
  return 'done';
end;
$$;

-- ---------------------------------------------------------------- 권한

-- 함수는 기본적으로 PUBLIC에 실행 권한이 붙는다. 명시적으로 걷어낸다.
revoke all on function public.select_character_image(uuid, uuid) from public, anon;
grant execute on function public.select_character_image(uuid, uuid) to authenticated;

revoke all on function
  public.finish_character_batch(uuid, public.character_image_kind, integer)
  from public, anon, authenticated;
grant execute on function
  public.finish_character_batch(uuid, public.character_image_kind, integer)
  to service_role;
