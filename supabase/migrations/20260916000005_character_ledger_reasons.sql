-- 캐릭터 만들기가 세 행위로 나뉘면서 원장 사유도 나뉜다. — docs/기획서.md §4
--
--   후보 뽑기 1  ·  수정 1회 1  ·  완성(3방향) 2
--
-- 셋을 전부 character_charge로 적으면 내역 화면이 "캐릭터 만들기 −1"을 세 번 보여주고,
-- 사람이 자기가 무엇에 돈을 썼는지 되짚을 수 없다.
-- 완성(2크레딧)은 기존 character_charge / character_refund를 그대로 쓴다.
--
-- ALTER TYPE ... ADD VALUE 는 같은 트랜잭션 안에서 그 값을 쓸 수 없다.
-- 그래서 이 파일은 값 추가만 하고, 값을 쓰는 것은 다음 마이그레이션과 Edge Function이 한다.
--   — 20260916000002_ledger_reasons.sql과 같은 이유

alter type public.ledger_reason add value if not exists 'character_draft_charge';
alter type public.ledger_reason add value if not exists 'character_draft_refund';
alter type public.ledger_reason add value if not exists 'character_edit_charge';
alter type public.ledger_reason add value if not exists 'character_edit_refund';
