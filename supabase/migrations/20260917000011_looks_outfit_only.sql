-- 룩은 코디 한 벌 + 장소
--
-- 머리는 캐릭터를 만들 때 성별별 사진으로 정한다(20260917000010). 룩에서는 머리를 안 고른다.
-- 그래서 looks.hair_preset_id의 NOT NULL을 푼다. 열을 지우는 게 아니다 — 예전 룩은 그대로 유효하다.
-- 옷은 looks_outfit_or_separates가 계속 강제한다(코디 한 벌이거나 상의·하의 둘 다).

alter table public.looks alter column hair_preset_id drop not null;
