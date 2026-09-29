-- 메이크업 시드 — docs/기획서.md §3
--
-- 성별에 매인 옵션이다(gender_id). 여성 5종, 남성 3종. 중성적은 없다(줄이 안 나온다).
-- prompt는 "예쁘게"가 아니라 **무엇이 얹혀 있는지**를 적는다 — 베이스·눈썹·라인·속눈썹·립·블러셔.
-- 다듬기에서 바꿀 수 있다. 화장은 얼굴을 바꾸지 않으니 편집으로 된다(refine-character의 CHANGE_PHRASE).
-- 미리보기는 못 한다 — 화장을 새로 그리는 건 생성이다. 슬라이더(연하게)는 지금 화장을 빼는 쪽만 미리 보인다.

insert into public.character_options
  (id, kind, name, description, prompt, thumbnail_path, sort_order, gender_id) values
  -- 여성
  ('a9999999-0000-4000-8000-000000000101', 'makeup', '노메이크업', '스킨케어만',
   'no makeup at all: bare, well-cared-for skin with its own texture, natural untinted brows and lashes, the natural lip colour, no blush',
   null, 1, 'a2222222-0000-4000-8000-000000000001'),
  ('a9999999-0000-4000-8000-000000000102', 'makeup', '내추럴', '거의 안 한 듯',
   'minimal natural makeup: a sheer skin-like base, softly groomed brows in their own colour, a light lash curl with barely-there mascara, a sheer tinted lip close to the natural lip colour, no visible eyeshadow, no eyeliner, no blush',
   null, 2, 'a2222222-0000-4000-8000-000000000001'),
  ('a9999999-0000-4000-8000-000000000103', 'makeup', '데일리', '가벼운 일상 화장',
   'light everyday Korean makeup: a dewy skin-like base, soft ash-brown brows, a very thin grey-brown tightline, softly defined curled lashes, the faintest mauve-taupe lid wash, a whisper of cool pink blush under the eyes, a sheer cool pink lip tint',
   null, 3, 'a2222222-0000-4000-8000-000000000001'),
  ('a9999999-0000-4000-8000-000000000104', 'makeup', '글램', '또렷한 풀 메이크업',
   'polished glam makeup: a flawless dewy base, defined brows, a precise winged eyeliner, full volumised lashes, soft-smoky taupe and rose eyeshadow, sculpted contour and highlight, a rich rose-pink or muted red lip',
   null, 4, 'a2222222-0000-4000-8000-000000000001'),
  ('a9999999-0000-4000-8000-000000000105', 'makeup', '스모키', '깊은 눈 화장',
   'cool smoky eye makeup: charcoal-brown shadow blended out around the eye, a dark tightline and liner, dense dark lashes, a nude or muted lip, minimal blush',
   null, 5, 'a2222222-0000-4000-8000-000000000001'),
  -- 남성
  ('a9999999-0000-4000-8000-000000000201', 'makeup', '맨얼굴', '스킨케어만',
   'no makeup at all, only skincare: clear skin with visible pores, natural brows and lashes, natural lip colour',
   null, 1, 'a2222222-0000-4000-8000-000000000002'),
  ('a9999999-0000-4000-8000-000000000202', 'makeup', '그루밍', '정리만 한 얼굴',
   'a groomed no-makeup look: tidied brows, evened skin tone, a healthy natural sheen, nothing that reads as makeup',
   null, 2, 'a2222222-0000-4000-8000-000000000002'),
  ('a9999999-0000-4000-8000-000000000203', 'makeup', '가벼운 메이크업', '살짝 보정',
   'light grooming makeup for men: sheer skin tone correction, lightly filled-in brows, a faint lip balm tint, no visible eye makeup or blush',
   null, 3, 'a2222222-0000-4000-8000-000000000002')
on conflict (id) do update set
  kind = excluded.kind, name = excluded.name, description = excluded.description, prompt = excluded.prompt,
  sort_order = excluded.sort_order, gender_id = excluded.gender_id, is_active = true;
