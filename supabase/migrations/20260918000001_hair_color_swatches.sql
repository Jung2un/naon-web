-- 기존 ID와 색은 유지하고 두 가지 컬러만 추가한다.
insert into public.character_options (id, kind, name, description, prompt, thumbnail_path, sort_order)
values
 ('a5555555-0000-4000-8000-000000000006', 'hair_color', '코토리 베이지', null, 'soft muted ash beige hair with cool taupe undertones', null, 6),
 ('a5555555-0000-4000-8000-000000000007', 'hair_color', '핑크 브라운', null, 'muted pink brown hair with rosy undertones', null, 7)
on conflict (id) do nothing;
