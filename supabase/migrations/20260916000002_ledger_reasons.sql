-- 원장 사유 확장
--
-- 캐릭터(2크레딧)와 룩(1크레딧)도 GPU가 도는 행위라 크레딧을 쓴다.
-- 기존 job_charge를 재사용하면 크레딧 내역에 "영상 변환"으로 떠서 거짓말이 된다.
-- 사유를 행위별로 나눠 내역 화면이 실제로 일어난 일을 그대로 말하게 한다.
--
-- ALTER TYPE ... ADD VALUE 는 같은 트랜잭션 안에서 그 값을 쓸 수 없다.
-- 그래서 이 파일은 값 추가만 하고, 값을 쓰는 함수는 다음 마이그레이션에 둔다.

alter type public.ledger_reason add value if not exists 'character_charge';
alter type public.ledger_reason add value if not exists 'character_refund';
alter type public.ledger_reason add value if not exists 'look_charge';
alter type public.ledger_reason add value if not exists 'look_refund';
