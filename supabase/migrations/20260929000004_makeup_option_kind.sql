-- 메이크업(makeup) 갈래를 character_option_kind에 더한다. — docs/기획서.md §3
--
-- 화장은 그동안 성별별 연출(GENDER_PRESENTATION)에 박혀 있어서 사용자가 고를 수 없었고,
-- 결과가 "화장한 티"로 굳어 있었다. 이제 1단계와 다듬기에서 칩으로 고른다.
--
-- ALTER TYPE ... ADD VALUE 는 같은 트랜잭션 안에서 그 값을 쓸 수 없다. 시드는 다음 파일이 한다.
--   — 20260929000001_face_option_kind.sql과 같은 이유

alter type public.character_option_kind add value if not exists 'makeup';
