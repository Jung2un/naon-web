-- 얼굴상 시드 + 얼굴 세부 조정(슬라이더) — docs/기획서.md §3
--
-- 1. 얼굴상(face). 성별에 매인 옵션이다(gender_id). 화면은 고른 성별의 얼굴상만 보여주고
--    함수는 다른 성별의 얼굴상을 보내면 거절한다 — 성별별 머리(20260917000010)와 같은 방식.
--    중성적은 얼굴상이 없다. 없으면 화면이 그 줄을 안 그린다.
--    prompt는 동물 이름이 아니라 **그 인상을 만드는 얼굴 요소**를 적는다. 모델은 "고양이상"을 모른다.
--    이름은 캐스팅 관용어라 따옴표로 같이 넣되, 실제 지시는 눈·광대·턱의 모양이다.
--
-- 2. 세부 조정(adjustments). 후보를 고른 뒤 슬라이더로 머리색 강도·눈·코·눈썹의 각도와 높낮이를
--    -2 ~ +2 다섯 칸으로 고친다. 칩(traits)과 같은 성격이라 characters와 character_images에
--    같은 방식으로 붙는다 — 이미지 행에는 노린 값이, 캐릭터 행에는 성공한 값이 있다.
--    자유 프롬프트가 아니다. 칸 수가 정해진 정수만 받고, 문장은 _shared/prompt.ts가 만든다.
--
-- 3. 되돌리기(select_character_image)가 이제 속성도 같이 되돌린다. 전에는 그림만 되돌아가고
--    칩·슬라이더는 마지막 수정 값에 머물러서, 화면이 있지도 않은 머리 모양을 말했다.

-- ---------------------------------------------------------------- 1. 얼굴상

insert into public.character_options
  (id, kind, name, description, prompt, thumbnail_path, sort_order, gender_id) values
  -- 여성
  ('a8888888-0000-4000-8000-000000000101', 'face', '강아지상', null,
   'a "puppy-like" face: large round eyes with softly downturned outer corners and a warm trusting gaze, gently rounded features and full soft cheeks, an approachable friendly impression',
   null, 1, 'a2222222-0000-4000-8000-000000000001'),
  ('a8888888-0000-4000-8000-000000000102', 'face', '고양이상', null,
   'a "cat-like" face: almond-shaped eyes with subtly lifted outer corners, defined high cheekbones, a slim tapered jaw and a small pointed chin, a cool sleek self-possessed impression',
   null, 2, 'a2222222-0000-4000-8000-000000000001'),
  ('a8888888-0000-4000-8000-000000000103', 'face', '토끼상', null,
   'a "rabbit-like" face: big round bright eyes, a small short nose, a small soft mouth whose front teeth show a little when smiling, rounded youthful cheeks, an innocent lively impression',
   null, 3, 'a2222222-0000-4000-8000-000000000001'),
  ('a8888888-0000-4000-8000-000000000104', 'face', '꼬부기상', null,
   'a "baby-turtle-like" face: very large round wide-set eyes, full round cheeks, a small button nose and a wide open smile, a cute playful impression',
   null, 4, 'a2222222-0000-4000-8000-000000000001'),
  ('a8888888-0000-4000-8000-000000000105', 'face', '두부상', null,
   'a "tofu-like" face: soft smooth rounded features with no sharp angles, a pale even complexion, mild gentle eyes and a small neat mouth, a plain clean wholesome impression',
   null, 5, 'a2222222-0000-4000-8000-000000000001'),
  ('a8888888-0000-4000-8000-000000000106', 'face', '사막여우상', null,
   'a "fennec-fox-like" face: a small narrow face with large wide-set eyes whose outer corners lift slightly, a delicate small nose and a pointed small chin, a sharp-yet-cute impression',
   null, 6, 'a2222222-0000-4000-8000-000000000001'),
  -- 남성
  ('a8888888-0000-4000-8000-000000000201', 'face', '강아지상', null,
   'a "puppy-like" face: round eyes with softly downturned outer corners and a warm open gaze, gently rounded features and a soft jaw, an approachable friendly impression',
   null, 1, 'a2222222-0000-4000-8000-000000000002'),
  ('a8888888-0000-4000-8000-000000000202', 'face', '공룡상', null,
   'a "dinosaur-like" face: a long face with a strong prominent jaw and chin, small deep-set eyes, a high straight nose bridge and a wide mouth, a rugged unconventional charismatic impression',
   null, 2, 'a2222222-0000-4000-8000-000000000002'),
  ('a8888888-0000-4000-8000-000000000203', 'face', '사막여우상', null,
   'a "fennec-fox-like" face: a small narrow face with large wide-set eyes whose outer corners lift slightly, a slim nose and a pointed chin, a sharp-yet-boyish impression',
   null, 3, 'a2222222-0000-4000-8000-000000000002'),
  ('a8888888-0000-4000-8000-000000000204', 'face', '늑대상', null,
   'a "wolf-like" face: narrow sharp eyes with an intense gaze, angular high cheekbones, a strong straight nose and a lean sharply defined jawline, a fierce charismatic impression',
   null, 4, 'a2222222-0000-4000-8000-000000000002'),
  ('a8888888-0000-4000-8000-000000000205', 'face', '두부상', null,
   'a "tofu-like" face: soft smooth rounded features with no sharp angles, a pale even complexion, mild gentle eyes and a neat mouth, a plain clean wholesome impression',
   null, 5, 'a2222222-0000-4000-8000-000000000002'),
  ('a8888888-0000-4000-8000-000000000206', 'face', '아랍상', null,
   'a deeply contoured face: deep-set eyes under strong dark straight brows, a high prominent nose bridge, pronounced brow ridge and cheek contours and a defined jaw, an unusually chiseled striking impression while still clearly Korean',
   null, 6, 'a2222222-0000-4000-8000-000000000002')
on conflict (id) do update set
  kind = excluded.kind, name = excluded.name, prompt = excluded.prompt,
  sort_order = excluded.sort_order, gender_id = excluded.gender_id, is_active = true;

-- ---------------------------------------------------------------- 2. 세부 조정

alter table public.characters
  add column if not exists adjustments jsonb not null default '{}'::jsonb;

alter table public.character_images
  add column if not exists adjustments jsonb not null default '{}'::jsonb;

-- ---------------------------------------------------------------- 3. 함수

-- 되돌리기. 그림과 함께 그 그림을 만든 속성·조정값도 되돌린다.
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
  v_path    text;
  v_traits  jsonb;
  v_adjust  jsonb;
  v_stage   public.character_stage;
  v_status  public.job_status;
begin
  select c.stage, c.status into v_stage, v_status
  from public.characters c
  where c.id = p_character_id and c.user_id = auth.uid();

  if v_stage is null then return 'not_found'; end if;
  if v_status = 'processing' then return 'busy'; end if;
  if v_stage not in ('draft', 'refining') then return 'not_found'; end if;

  select ci.image_path, ci.traits, ci.adjustments into v_path, v_traits, v_adjust
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
         traits          = coalesce(v_traits, traits),
         adjustments     = coalesce(v_adjust, '{}'::jsonb),
         stage           = 'refining',
         status          = 'done',
         error_code      = null,
         updated_at      = now()
   where id = p_character_id and user_id = auth.uid();

  return 'ok';
end;
$$;

-- 배치 끝내기. 20260916000006과 같고, 수정본 성공 시 adjustments도 캐릭터로 옮기는 줄만 더했다.
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
  v_adjust  jsonb;
begin
  select count(*) filter (where status in ('queued', 'processing')),
         count(*) filter (where status = 'done'),
         count(*)
    into v_pending, v_done, v_total
  from public.character_images
  where character_id = p_character_id and kind = p_kind and round = p_round;

  if v_pending > 0 then return 'pending'; end if;

  if p_kind = 'view' then
    v_ok := (v_total > 0 and v_done = v_total);
  else
    v_ok := (v_done > 0);
  end if;

  if not v_ok then
    update public.characters
       set status     = 'failed',
           error_code = 'UPSTREAM_ERROR',
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
    select image_path, traits, adjustments into v_path, v_traits, v_adjust
    from public.character_images
    where character_id = p_character_id
      and kind = 'refined' and round = p_round and status = 'done'
    limit 1;

    update public.characters
       set status          = 'done',
           error_code      = null,
           base_image_path = coalesce(v_path, base_image_path),
           thumbnail_path  = coalesce(v_path, thumbnail_path),
           -- 성공했을 때만 속성·조정값을 옮긴다. 실패하면 화면은 이전 값 그대로다.
           traits          = coalesce(v_traits, traits),
           adjustments     = coalesce(v_adjust, adjustments),
           updated_at      = now()
     where id = p_character_id and status = 'processing';

  else
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
