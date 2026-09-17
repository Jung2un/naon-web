-- 룩의 장소는 선택
--
-- 기본은 인물만 바꾸고 배경은 찍은 그대로 둔다. 장소 프리셋은 자기 장소가 드러나는 게
-- 싫은 사용자만 고른다. 그래서 looks.scene_preset_id의 NOT NULL을 푼다.
-- null = 배경을 바꾸지 않는다(create-look의 지시문이 "배경 그대로"를 넣는다).
-- 열을 지우는 게 아니다 — 장소를 고른 예전 룩은 그대로 유효하다.

alter table public.looks alter column scene_preset_id drop not null;
