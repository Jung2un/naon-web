-- 머리색 프롬프트를 레퍼런스 사진 톤에 맞춘다. — 2026-09-29
--
-- 사용자가 색마다 2~4장의 레퍼런스를 줬고, 그 머리카락 군집을 뽑아 보니 전부 **채도가 낮은 톤**이었다.
-- 금발은 노란 금색이 아니라 베이지 블론드, 밝은 갈색은 밀크티 브라운, 핑크 브라운은 장밋빛 갈색,
-- 애쉬는 거의 무채색 회색, 검정은 살짝 차가운 자연 검정. "blonde hair"만 주면 모델은 금색을 그린다.
-- 화면 견본(src/lib/hair-colors.ts)도 같은 사진에서 뽑은 색이다. 여기만 고치면 되고 배포는 필요 없다.

update public.character_options set prompt = v.prompt
from (values
  ('a5555555-0000-4000-8000-000000000001'::uuid, 'natural soft black hair with a faint cool undertone, not flat jet-black, with visible strand detail'),
  ('a5555555-0000-4000-8000-000000000002'::uuid, 'deep chocolate dark brown hair, rich but low-saturation, warm only in the highlights'),
  ('a5555555-0000-4000-8000-000000000003'::uuid, 'light milk-tea brown hair, soft and low-saturation, never orange or copper'),
  ('a5555555-0000-4000-8000-000000000004'::uuid, 'cool ash grey hair with almost no warmth, a muted silver-grey with soft darker roots'),
  ('a5555555-0000-4000-8000-000000000005'::uuid, 'soft beige blonde hair, muted and low-saturation with a slightly ashy cast, never yellow or golden'),
  ('a5555555-0000-4000-8000-000000000006'::uuid, 'soft muted ash beige hair, a greyish taupe beige with cool undertones'),
  ('a5555555-0000-4000-8000-000000000007'::uuid, 'muted rose brown hair, a dusty pinkish brown that reads brown first and pink second, never bright pink')
) as v(id, prompt)
where character_options.id = v.id;
