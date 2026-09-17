-- 룩 프리셋에 '코디' 슬롯
--
-- 상의·하의를 따로 고르는 대신 전신 코디 한 벌을 고를 수 있게 한다.
-- ALTER TYPE ... ADD VALUE는 같은 트랜잭션에서 그 값을 쓸 수 없다.
-- 그래서 이 파일은 값 추가만 하고, 쓰는 건 다음 마이그레이션에 둔다. — 20260916000002와 같은 이유

alter type public.preset_slot add value if not exists 'outfit';
