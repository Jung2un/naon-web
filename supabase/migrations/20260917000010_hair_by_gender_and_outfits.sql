-- 성별별 헤어 사진 + 룩 전신 코디
--
-- 1. 캐릭터 만들기의 '머리'를 성별별 사진 타일로 바꾼다.
--    character_options에 gender_id를 더해 그 머리가 어느 성별 것인지 적는다(null이면 성별 공통).
--    화면은 고른 성별의 머리만 보여주고, 함수는 다른 성별 머리를 보내면 거절한다.
--    옛 글자 칩 6개(a4444444-…-00000000000N)는 끈다. 2026-09-17 기준 캐릭터가 0건이라 참조가 없다.
--
-- 2. 룩에 전신 코디 한 벌을 고르는 선택지를 더한다.
--    presets.slot = 'outfit', category는 탭 이름(데일리·무대·아우터).
--    looks는 코디를 고르면 상의·하의가 비고, 안 고르면 예전처럼 상의·하의가 다 있어야 한다.
--    top/bottom의 NOT NULL을 푸는 건 열을 지우거나 이름을 바꾸는 게 아니다 — 기존 행은 그대로 유효하다.
--
-- 사진은 public/catalog/(trait/hair · outfit)에 앱과 같이 싣는다. — src/lib/catalog.ts
-- id는 고정이다. fixtures.ts가 같은 id를 쓴다.

-- ---------------------------------------------------------------- 1. 성별별 머리

alter table public.character_options
  add column if not exists gender_id uuid references public.character_options (id) on delete set null;

update public.character_options
   set is_active = false
 where kind = 'hair'
   and id in (
     'a4444444-0000-4000-8000-000000000001', 'a4444444-0000-4000-8000-000000000002',
     'a4444444-0000-4000-8000-000000000003', 'a4444444-0000-4000-8000-000000000004',
     'a4444444-0000-4000-8000-000000000005', 'a4444444-0000-4000-8000-000000000006'
   );

insert into public.character_options
  (id, kind, name, description, prompt, thumbnail_path, sort_order, gender_id) values
  ('a4444444-0000-4000-8000-000000000101', 'hair', '레이어드 중단발', null, 'shoulder-length layered hair with soft face-framing curtain bangs', 'trait/hair/female/1.jpg', 1, 'a2222222-0000-4000-8000-000000000001'),
  ('a4444444-0000-4000-8000-000000000102', 'hair', '반묶음 웨이브', null, 'long loose wavy hair in a relaxed half-up style', 'trait/hair/female/2.jpg', 2, 'a2222222-0000-4000-8000-000000000001'),
  ('a4444444-0000-4000-8000-000000000103', 'hair', 'C컬 중단발', null, 'shoulder-length hair with soft inward C-curl ends and wispy side bangs', 'trait/hair/female/3.jpg', 3, 'a2222222-0000-4000-8000-000000000001'),
  ('a4444444-0000-4000-8000-000000000104', 'hair', '하이 반묶음', null, 'long hair swept back into a sleek high half-up ponytail', 'trait/hair/female/4.jpg', 4, 'a2222222-0000-4000-8000-000000000001'),
  ('a4444444-0000-4000-8000-000000000105', 'hair', '단발 보브', null, 'chin-length bob with softly rounded inward ends', 'trait/hair/female/5.jpg', 5, 'a2222222-0000-4000-8000-000000000001'),
  ('a4444444-0000-4000-8000-000000000106', 'hair', '롱 레이어드 웨이브', null, 'long voluminous layered waves with face-framing layers', 'trait/hair/female/6.jpg', 6, 'a2222222-0000-4000-8000-000000000001'),
  ('a4444444-0000-4000-8000-000000000107', 'hair', '하이 포니테일', null, 'high ponytail with loose wispy strands framing the face', 'trait/hair/female/7.jpg', 7, 'a2222222-0000-4000-8000-000000000001'),
  ('a4444444-0000-4000-8000-000000000108', 'hair', '브레이드 반묶음', null, 'long wavy hair with a braided half-up crown', 'trait/hair/female/8.jpg', 8, 'a2222222-0000-4000-8000-000000000001'),
  ('a4444444-0000-4000-8000-000000000201', 'hair', '쉼표머리', null, 'short layered hair with a soft comma-shaped curved fringe', 'trait/hair/male/1.jpg', 1, 'a2222222-0000-4000-8000-000000000002'),
  ('a4444444-0000-4000-8000-000000000202', 'hair', '가르마 펌', null, 'side-parted textured perm with natural volume', 'trait/hair/male/2.jpg', 2, 'a2222222-0000-4000-8000-000000000002'),
  ('a4444444-0000-4000-8000-000000000203', 'hair', '센터 가르마', null, 'medium-length curtain hair with a soft center part', 'trait/hair/male/3.jpg', 3, 'a2222222-0000-4000-8000-000000000002'),
  ('a4444444-0000-4000-8000-000000000204', 'hair', '텍스처 크롭', null, 'short spiky textured crop cut', 'trait/hair/male/4.jpg', 4, 'a2222222-0000-4000-8000-000000000002'),
  ('a4444444-0000-4000-8000-000000000205', 'hair', '울프컷', null, 'shaggy wolf cut with longer layers at the nape', 'trait/hair/male/5.jpg', 5, 'a2222222-0000-4000-8000-000000000002'),
  ('a4444444-0000-4000-8000-000000000206', 'hair', '브라운 레이어드', null, 'medium-length layered hair in soft brown with a light mullet nape', 'trait/hair/male/6.jpg', 6, 'a2222222-0000-4000-8000-000000000002'),
  ('a4444444-0000-4000-8000-000000000207', 'hair', '장발', null, 'long straight hair swept to the side past the jawline', 'trait/hair/male/7.jpg', 7, 'a2222222-0000-4000-8000-000000000002'),
  ('a4444444-0000-4000-8000-000000000208', 'hair', '브라운 웨이브펌', null, 'light brown wavy perm with soft volume', 'trait/hair/male/8.jpg', 8, 'a2222222-0000-4000-8000-000000000002'),
  ('a4444444-0000-4000-8000-000000000301', 'hair', '턱선 보브', null, 'jaw-length tousled bob', 'trait/hair/neutral/1.jpg', 1, 'a2222222-0000-4000-8000-000000000003'),
  ('a4444444-0000-4000-8000-000000000302', 'hair', '샤기 미디엄', null, 'messy medium-length shag with piecey layers', 'trait/hair/neutral/2.jpg', 2, 'a2222222-0000-4000-8000-000000000003'),
  ('a4444444-0000-4000-8000-000000000303', 'hair', '머쉬룸컷', null, 'rounded mushroom cut with full blunt bangs', 'trait/hair/neutral/3.jpg', 3, 'a2222222-0000-4000-8000-000000000003'),
  ('a4444444-0000-4000-8000-000000000304', 'hair', '샤기 숏', null, 'short messy shag with long wispy strands', 'trait/hair/neutral/4.jpg', 4, 'a2222222-0000-4000-8000-000000000003'),
  ('a4444444-0000-4000-8000-000000000305', 'hair', '울프컷', null, 'medium wolf cut with feathered layers', 'trait/hair/neutral/5.jpg', 5, 'a2222222-0000-4000-8000-000000000003'),
  ('a4444444-0000-4000-8000-000000000306', 'hair', '크롭 픽시', null, 'short cropped pixie with choppy bangs', 'trait/hair/neutral/6.jpg', 6, 'a2222222-0000-4000-8000-000000000003'),
  ('a4444444-0000-4000-8000-000000000307', 'hair', '일자 중단발', null, 'straight shoulder-length lob with a center part', 'trait/hair/neutral/7.jpg', 7, 'a2222222-0000-4000-8000-000000000003'),
  ('a4444444-0000-4000-8000-000000000308', 'hair', '롱 울프컷', null, 'long layered wolf cut with wispy bangs', 'trait/hair/neutral/8.jpg', 8, 'a2222222-0000-4000-8000-000000000003')
on conflict (id) do update set
  name = excluded.name, prompt = excluded.prompt, thumbnail_path = excluded.thumbnail_path,
  sort_order = excluded.sort_order, gender_id = excluded.gender_id, is_active = true;

-- ---------------------------------------------------------------- 2. 코디

alter table public.presets add column if not exists category text;

insert into public.presets
  (id, slot, name, category, prompt, thumbnail_path, sort_order) values
  ('55555555-0000-4000-8000-000000000101', 'outfit', '오버핏 블레이저', '데일리', 'oversized greige blazer over a light blue shirt with wide greige trousers and white sneakers', 'outfit/daily/1.jpg', 101),
  ('55555555-0000-4000-8000-000000000102', 'outfit', '체크 오버셔츠 레이어드', '데일리', 'plaid overshirt with a cream knit vest and tie, a pleated skirt layered over wide charcoal trousers', 'outfit/daily/2.jpg', 102),
  ('55555555-0000-4000-8000-000000000103', 'outfit', '그레이 윈드브레이커', '데일리', 'light grey zip-up windbreaker over a sheer white layered skirt and grey cargo pants with sneakers', 'outfit/daily/3.jpg', 103),
  ('55555555-0000-4000-8000-000000000104', 'outfit', '시어 레이어드', '데일리', 'blush pink wrap cardigan with a sheer tulle skirt layered over white joggers and chunky sneakers', 'outfit/daily/4.jpg', 104),
  ('55555555-0000-4000-8000-000000000105', 'outfit', '워크 재킷 데님', '데일리', 'brown canvas work jacket over a dark shirt with wide faded denim jeans and black loafers', 'outfit/daily/5.jpg', 105),
  ('55555555-0000-4000-8000-000000000106', 'outfit', '고프코어', '데일리', 'cobalt blue windbreaker with a black utility vest and black cargo joggers with running sneakers', 'outfit/daily/6.jpg', 106),
  ('55555555-0000-4000-8000-000000000107', 'outfit', '오버핏 수트', '데일리', 'oversized charcoal suit with a white shirt, black tie and wide pleated trousers', 'outfit/daily/7.jpg', 107),
  ('55555555-0000-4000-8000-000000000108', 'outfit', '세이지 패딩 카고', '데일리', 'sage green cropped puffer jacket over a grey hoodie with cream cargo pants and sneakers', 'outfit/daily/8.jpg', 108),
  ('55555555-0000-4000-8000-000000000109', 'outfit', '카고 쇼츠 베스트', '데일리', 'cream cable knit sweater under an olive utility vest with olive cargo shorts and trail sneakers', 'outfit/daily/9.jpg', 109),
  ('55555555-0000-4000-8000-000000000110', 'outfit', '올블랙 유틸리티', '데일리', 'black cropped utility jacket over a black turtleneck with black strapped cargo pants', 'outfit/daily/10.jpg', 110),
  ('55555555-0000-4000-8000-000000000111', 'outfit', '그래픽 티 데님', '데일리', 'washed grey graphic t-shirt over a long sleeve tee, a plaid shirt tied at the waist and wide washed black jeans', 'outfit/daily/11.jpg', 111),
  ('55555555-0000-4000-8000-000000000112', 'outfit', '랩 블레이저', '데일리', 'charcoal blazer wrapped with a draped sash over wide grey trousers and white sneakers', 'outfit/daily/12.jpg', 112),
  ('55555555-0000-4000-8000-000000000201', 'outfit', '메탈릭 퓨처', '무대', 'metallic silver cropped halter top with a glossy oversized jacket and silver-black paneled wide pants with platform boots', 'outfit/stage/1.jpg', 201),
  ('55555555-0000-4000-8000-000000000202', 'outfit', '레더 라이더', '무대', 'black leather rider jacket over a charcoal knit with wide black trousers', 'outfit/stage/2.jpg', 202),
  ('55555555-0000-4000-8000-000000000203', 'outfit', '리본 드레스', '무대', 'cream deconstructed ribbon dress with layered ruffles and lace-up white boots', 'outfit/stage/3.jpg', 203),
  ('55555555-0000-4000-8000-000000000204', 'outfit', '화이트 수트', '무대', 'cream embroidered suit with a silk tie and wide cream trousers', 'outfit/stage/4.jpg', 204),
  ('55555555-0000-4000-8000-000000000205', 'outfit', '그레이 카고 셋업', '무대', 'light grey utility jacket over a grey tee with grey wide cargo pants and sneakers', 'outfit/stage/5.jpg', 205),
  ('55555555-0000-4000-8000-000000000206', 'outfit', '핀스트라이프 레이어드', '무대', 'black pinstripe blazer with a white shirt and tie, a pleated skirt panel layered over pinstripe wide trousers', 'outfit/stage/6.jpg', 206),
  ('55555555-0000-4000-8000-000000000207', 'outfit', '네이비 벨티드 수트', '무대', 'navy belted suit jacket with wide navy trousers', 'outfit/stage/7.jpg', 207),
  ('55555555-0000-4000-8000-000000000208', 'outfit', '펄 프린지', '무대', 'sheer ivory top with pearl and fringe strands over wide ivory trousers', 'outfit/stage/8.jpg', 208),
  ('55555555-0000-4000-8000-000000000209', 'outfit', '그런지 레이어드', '무대', 'distressed charcoal layered top and shredded skirt over wide grey pants with combat boots', 'outfit/stage/9.jpg', 209),
  ('55555555-0000-4000-8000-000000000210', 'outfit', '트랙 저지', '무대', 'black oversized jersey with white piping and wide black track pants with white stripes', 'outfit/stage/10.jpg', 210),
  ('55555555-0000-4000-8000-000000000211', 'outfit', '고딕 레이스', '무대', 'black sheer lace layered gown over black trousers with combat boots', 'outfit/stage/11.jpg', 211),
  ('55555555-0000-4000-8000-000000000212', 'outfit', '버건디 블레이저', '무대', 'burgundy blazer over a charcoal knit with wide black trousers', 'outfit/stage/12.jpg', 212),
  ('55555555-0000-4000-8000-000000000301', 'outfit', '레더 봄버', '아우터', 'dark brown leather bomber jacket over a cream top with dark indigo wide jeans', 'outfit/outer/1.jpg', 301),
  ('55555555-0000-4000-8000-000000000302', 'outfit', '레더 재킷 셋업', '아우터', 'dark brown leather jacket over a charcoal knit with brown wide trousers', 'outfit/outer/2.jpg', 302),
  ('55555555-0000-4000-8000-000000000303', 'outfit', '하이넥 윈드 재킷', '아우터', 'brown funnel-neck windbreaker with cream wide trousers and grey sneakers', 'outfit/outer/3.jpg', 303),
  ('55555555-0000-4000-8000-000000000304', 'outfit', '컬러블록 바람막이', '아우터', 'charcoal and slate blue hooded windbreaker with black track pants and sneakers', 'outfit/outer/4.jpg', 304),
  ('55555555-0000-4000-8000-000000000305', 'outfit', '아이보리 경량 패딩', '아우터', 'ivory hooded puffer jacket with grey wide sweatpants and sneakers', 'outfit/outer/5.jpg', 305),
  ('55555555-0000-4000-8000-000000000306', 'outfit', '블랙 경량 패딩', '아우터', 'black hooded puffer jacket over a black sweater with black trousers', 'outfit/outer/6.jpg', 306)
on conflict (id) do update set
  name = excluded.name, category = excluded.category, prompt = excluded.prompt,
  thumbnail_path = excluded.thumbnail_path, sort_order = excluded.sort_order, is_active = true;

alter table public.looks
  add column if not exists outfit_preset_id uuid references public.presets (id);

alter table public.looks alter column top_preset_id drop not null;
alter table public.looks alter column bottom_preset_id drop not null;

-- 코디 한 벌이거나, 상의·하의가 다 있거나. 둘 다 비면 입힐 옷이 없다.
alter table public.looks drop constraint if exists looks_outfit_or_separates;
alter table public.looks add constraint looks_outfit_or_separates check (
  outfit_preset_id is not null
  or (top_preset_id is not null and bottom_preset_id is not null)
);
