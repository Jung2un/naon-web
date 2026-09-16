-- 톤·속성 카탈로그 시드 — docs/기획서.md §3
--
-- 프리셋 시드와 같은 이유로 마이그레이션에 둔다. seed.sql은 로컬 db reset에서만 돌아서
-- 운영에 안 올라간다. id도 같은 이유로 고정한다 — characters.tone_id·traits가 이 id를 들고 있어서
-- 환경마다 값이 다르면 캐릭터를 옮길 수 없다.
--
-- prompt는 모델에 넘기는 영어 조각이다. 조립은 supabase/functions/_shared/prompt.ts가 한다.
-- 결과가 마음에 안 들면 **여기만 고친다. 배포가 필요 없다.**
--
-- thumbnail_path는 톤 6장만 쓴다. 속성은 글자 칩이라 이미지가 없어도 화면이 완성된다.
-- presets 버킷에 tone/1.jpg … tone/6.jpg로 올리면 SQL을 안 건드려도 붙는다.
--
-- 나이대는 20대부터 시작한다. 실사 톤으로 사람을 만들어 영상에 갈아끼우는 제품이라
-- 미성년으로 보이는 옵션은 두지 않는다. — 기획서 §3

insert into public.character_options
  (id, kind, name, description, prompt, thumbnail_path, sort_order) values
  -- 톤 — 1단계에서만 정한다. 바꾸려면 후보부터 다시 뽑는다
  ('a1111111-0000-4000-8000-000000000001', 'tone', '실사', '사진처럼',
   'photorealistic portrait photograph, natural skin texture, 50mm lens, soft daylight',
   'tone/1.jpg', 1),
  ('a1111111-0000-4000-8000-000000000002', 'tone', '시네마틱', '영화 한 장면처럼',
   'cinematic film still, soft key light, shallow depth of field, subtle film grain',
   'tone/2.jpg', 2),
  ('a1111111-0000-4000-8000-000000000003', 'tone', '화보', '스튜디오 조명',
   'high fashion editorial portrait, studio strobe lighting, clean seamless backdrop',
   'tone/3.jpg', 3),
  ('a1111111-0000-4000-8000-000000000004', 'tone', '일상 스냅', '폰으로 찍은 느낌',
   'candid smartphone snapshot, natural window light, everyday setting',
   'tone/4.jpg', 4),
  ('a1111111-0000-4000-8000-000000000005', 'tone', '애니', '그림체',
   'anime illustration, clean line art, cel shading, soft gradients',
   'tone/5.jpg', 5),
  ('a1111111-0000-4000-8000-000000000006', 'tone', '3D 캐릭터', '입체 렌더',
   'stylized 3d character render, soft global illumination, subsurface skin shading',
   'tone/6.jpg', 6),

  -- 성별 (필수)
  ('a2222222-0000-4000-8000-000000000001', 'gender', '여성',   null, 'a woman',               null, 1),
  ('a2222222-0000-4000-8000-000000000002', 'gender', '남성',   null, 'a man',                 null, 2),
  ('a2222222-0000-4000-8000-000000000003', 'gender', '중성적', null, 'an androgynous person', null, 3),

  -- 나이대 (필수)
  ('a3333333-0000-4000-8000-000000000001', 'age', '20대 초반', null, 'in their early twenties', null, 1),
  ('a3333333-0000-4000-8000-000000000002', 'age', '20대 후반', null, 'in their late twenties',  null, 2),
  ('a3333333-0000-4000-8000-000000000003', 'age', '30대',      null, 'in their thirties',       null, 3),
  ('a3333333-0000-4000-8000-000000000004', 'age', '40대',      null, 'in their forties',        null, 4),
  ('a3333333-0000-4000-8000-000000000005', 'age', '50대 이상', null, 'in their fifties',        null, 5),

  -- 머리 — 캐릭터의 기본형이다. 룩의 머리 프리셋이 그 위를 덮는다. — 기획서 §3
  ('a4444444-0000-4000-8000-000000000001', 'hair', '긴 생머리', null, 'long straight hair',      null, 1),
  ('a4444444-0000-4000-8000-000000000002', 'hair', '긴 웨이브', null, 'long wavy hair',          null, 2),
  ('a4444444-0000-4000-8000-000000000003', 'hair', '단발',      null, 'a chin-length bob',       null, 3),
  ('a4444444-0000-4000-8000-000000000004', 'hair', '숏컷',      null, 'a short cropped cut',     null, 4),
  ('a4444444-0000-4000-8000-000000000005', 'hair', '포니테일',  null, 'hair tied in a ponytail', null, 5),
  ('a4444444-0000-4000-8000-000000000006', 'hair', '반묶음',    null, 'half-up tied hair',       null, 6),

  -- 머리색
  ('a5555555-0000-4000-8000-000000000001', 'hair_color', '검정',      null, 'black hair',       null, 1),
  ('a5555555-0000-4000-8000-000000000002', 'hair_color', '진갈색',    null, 'dark brown hair',  null, 2),
  ('a5555555-0000-4000-8000-000000000003', 'hair_color', '밝은 갈색', null, 'light brown hair', null, 3),
  ('a5555555-0000-4000-8000-000000000004', 'hair_color', '애쉬',      null, 'ash grey hair',    null, 4),
  ('a5555555-0000-4000-8000-000000000005', 'hair_color', '금발',      null, 'blonde hair',      null, 5),

  -- 체형
  ('a6666666-0000-4000-8000-000000000001', 'body', '마른', null, 'a slim build',      null, 1),
  ('a6666666-0000-4000-8000-000000000002', 'body', '보통', null, 'an average build',  null, 2),
  ('a6666666-0000-4000-8000-000000000003', 'body', '탄탄', null, 'an athletic build', null, 3),
  ('a6666666-0000-4000-8000-000000000004', 'body', '통통', null, 'a fuller build',    null, 4),

  -- 분위기
  ('a7777777-0000-4000-8000-000000000001', 'vibe', '청순', null, 'a clean and gentle look',    null, 1),
  ('a7777777-0000-4000-8000-000000000002', 'vibe', '시크', null, 'a cool and chic look',       null, 2),
  ('a7777777-0000-4000-8000-000000000003', 'vibe', '발랄', null, 'a bright and cheerful look', null, 3),
  ('a7777777-0000-4000-8000-000000000004', 'vibe', '차분', null, 'a calm and composed look',   null, 4),
  ('a7777777-0000-4000-8000-000000000005', 'vibe', '도도', null, 'a confident and aloof look', null, 5),
  ('a7777777-0000-4000-8000-000000000006', 'vibe', '따뜻', null, 'a warm and friendly look',   null, 6)
on conflict (id) do update set
  kind           = excluded.kind,
  name           = excluded.name,
  description    = excluded.description,
  prompt         = excluded.prompt,
  thumbnail_path = excluded.thumbnail_path,
  sort_order     = excluded.sort_order;
