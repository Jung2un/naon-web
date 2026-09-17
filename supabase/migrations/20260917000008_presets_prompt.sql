-- 프리셋 영어 지시문
--
-- 룩 지시문이 프리셋의 한글 이름("니트", "카페")을 그대로 싣고 있었다.
-- 캐릭터 옵션은 처음부터 영어 조각(character_options.prompt)을 쓰는데 프리셋만 빠져 있었다.
-- 같은 방식으로 맞춘다. 배포 없이 이 열만 고쳐서 결과를 다듬을 수 있다.
--
-- 조각은 썸네일(public/catalog/)에 그린 모습과 같게 적는다. 타일에서 본 것과
-- 만들어진 룩이 어긋나지 않게 하려는 것이다. 썸네일을 바꾸면 여기도 같이 본다.
--
-- 추가만 한다. 빈 문자열이면 함수가 한글 이름으로 되돌아간다. — CLAUDE.md 마이그레이션

alter table public.presets add column if not exists prompt text not null default '';

update public.presets as p
   set prompt = v.prompt
  from (values
    -- 머리
    ('11111111-0000-4000-8000-000000000001', 'long soft wavy hair falling past the shoulders'),
    ('11111111-0000-4000-8000-000000000002', 'chin-length straight bob haircut with blunt bangs'),
    ('11111111-0000-4000-8000-000000000003', 'hair pulled back into a neat high ponytail'),
    ('11111111-0000-4000-8000-000000000004', 'short pixie cut with the ears showing'),
    -- 상의
    ('22222222-0000-4000-8000-000000000001', 'camel cable-knit crewneck sweater'),
    ('22222222-0000-4000-8000-000000000002', 'light blue oxford button-down shirt'),
    ('22222222-0000-4000-8000-000000000003', 'sage green pullover hoodie with drawstrings'),
    ('22222222-0000-4000-8000-000000000004', 'tailored navy blazer over a white inner top'),
    -- 하의
    ('33333333-0000-4000-8000-000000000001', 'mid-blue straight-leg denim jeans'),
    ('33333333-0000-4000-8000-000000000002', 'taupe tailored straight slacks with a front crease'),
    ('33333333-0000-4000-8000-000000000003', 'grey-blue pleated midi skirt'),
    ('33333333-0000-4000-8000-000000000004', 'dark green jogger track pants with white side stripes'),
    -- 장소
    ('44444444-0000-4000-8000-000000000001', 'a warm cozy cafe with a wooden counter and pendant lights'),
    ('44444444-0000-4000-8000-000000000002', 'a quiet city street with low-rise buildings in soft daylight'),
    ('44444444-0000-4000-8000-000000000003', 'a photo studio with a seamless paper backdrop and a softbox light'),
    ('44444444-0000-4000-8000-000000000004', 'a bright living room with a sofa, a plant and a window')
  ) as v(id, prompt)
 where p.id = v.id::uuid;
