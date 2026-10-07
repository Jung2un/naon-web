-- Runs only inside tests/local-db.mjs's isolated PGlite database.
begin;
insert into auth.users(id, email)
values ('91000000-0000-4000-8000-000000000001', 'character-test@example.invalid');
insert into public.characters(id, user_id, name, stage, status, base_image_path, thumbnail_path)
values ('91000000-0000-4000-8000-000000000002', '91000000-0000-4000-8000-000000000001',
  'customized face', 'refining', 'processing', 'original.jpg', 'original.jpg');
insert into public.character_images(id, character_id, kind, round, status, image_path, adjustments)
values ('91000000-0000-4000-8000-000000000003', '91000000-0000-4000-8000-000000000002',
  'refined', 1, 'done', 'applied-edit.jpg', '{"brow_tilt":26,"nose_width":40}');

do $$
declare c uuid := '91000000-0000-4000-8000-000000000002'; outcome text;
begin
  outcome := public.finish_character_batch(c, 'refined', 1);
  if outcome <> 'done' or (select base_image_path from public.characters where id=c) <> 'applied-edit.jpg'
    then raise exception 'Refinement did not become canonical'; end if;

  -- The front row reuses the canonical path, while side rows start queued.
  insert into public.character_images(character_id, kind, angle, round, status, source_image_path, image_path)
  values (c, 'view', 'front', 1, 'done', 'applied-edit.jpg', 'applied-edit.jpg'),
    (c, 'view', 'left45', 1, 'queued', 'applied-edit.jpg', null),
    (c, 'view', 'right45', 1, 'queued', 'applied-edit.jpg', null);
  update public.characters set stage='building', status='processing' where id=c;
  if public.finish_character_batch(c, 'view', 1) <> 'pending'
    then raise exception 'Reused front must not complete an unfinished batch'; end if;
  update public.character_images set status='done', image_path=angle::text || '.jpg'
    where character_id=c and kind='view' and angle <> 'front';
  outcome := public.finish_character_batch(c, 'view', 1);
  if outcome <> 'done' then raise exception 'Completion failed'; end if;
  if not exists (select 1 from public.characters where id=c and stage='ready' and status='done'
      and base_image_path='applied-edit.jpg' and thumbnail_path='applied-edit.jpg'
      and adjustments='{"brow_tilt":26,"nose_width":40}'::jsonb)
    then raise exception 'Completion lost the applied face or adjustments'; end if;
  if (select image_path from public.character_refs where character_id=c and angle='front') <> 'applied-edit.jpg'
    then raise exception 'Front reference was regenerated'; end if;
  if (select count(*) from public.character_refs where character_id=c) <> 3
    then raise exception 'Completion must retain all three angles'; end if;

  -- A failed side view must leave the applied face intact and allow recovery.
  update public.characters set stage='building', status='processing' where id=c;
  insert into public.character_images(character_id, kind, angle, round, status, image_path)
  values (c, 'view', 'front', 2, 'done', 'applied-edit.jpg'),
    (c, 'view', 'left45', 2, 'done', 'left-retry.jpg'),
    (c, 'view', 'right45', 2, 'failed', null);
  if public.finish_character_batch(c, 'view', 2) <> 'failed'
    then raise exception 'Partial views must fail'; end if;
  if not exists (select 1 from public.characters where id=c and stage='refining'
      and base_image_path='applied-edit.jpg' and thumbnail_path='applied-edit.jpg')
    then raise exception 'Failed completion overwrote the canonical face'; end if;
  if public.finish_character_batch(c, 'view', 2) <> 'already'
    then raise exception 'Failure was settled more than once'; end if;
end $$;
rollback;
select 'PASS: applied face survives completion, side-view failure and repeated settlement' as result;
