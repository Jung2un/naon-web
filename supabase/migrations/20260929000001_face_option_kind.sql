-- 얼굴상(face) 갈래를 character_option_kind에 더한다. — docs/기획서.md §3
--
-- 강아지상·고양이상 같은 "OO상"은 얼굴의 인상 자체라 1단계(후보 뽑기)에서만 고른다.
-- 다듬기에서는 못 바꾼다 — 얼굴을 바꾸는 건 다른 사람을 만드는 일이다.
--
-- ALTER TYPE ... ADD VALUE 는 같은 트랜잭션 안에서 그 값을 쓸 수 없다.
-- 그래서 이 파일은 값 추가만 하고, 시드는 다음 마이그레이션이 한다.
--   — 20260916000005_character_ledger_reasons.sql과 같은 이유

alter type public.character_option_kind add value if not exists 'face';
