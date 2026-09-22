-- 톤 문장 3차 — 결과물이 무지 회색 증명사진으로 수렴하던 원인 두 가지를 톤 쪽에서 막는다.
--
--  1. **장비를 이름으로 부르면 장비가 프레임에 들어온다.** 화보 톤의 `a large diffused softbox
--     from the front-left`가 실제로 왼쪽에 소프트박스가 찍힌 사진을 만들었다.
--     조명은 장비 이름이 아니라 **빛이 무엇을 하는지**로 쓴다.
--  2. **배경에 빛 사건이 없으면 무지 배경이 된다.** 카탈로그(`public/catalog/tone/1·3·4.jpg`)는
--     벽의 창 그림자 · 골든 역광 플레어 · 벽에 드리운 인물 그림자를 전부 갖고 있다.
--     "out of focus interior"만으론 그 자리가 비어 버린다.
--
-- 색 지시도 톤이 끝까지 쥔다. 공통 지시의 muted neutral은 `prompt.ts`에서 걷어냈다.
-- 애니 · 3D는 사진 톤이 아니라 건드리지 않는다. — docs/캐릭터-생성-프롬프트.md
update public.character_options as option
set prompt = revised.prompt
from (values
  ('a1111111-0000-4000-8000-000000000001'::uuid,
   'A photorealistic Korean lifestyle portrait with the quiet presence of an actor profile. Soft diffused window daylight falls across the face from one side and lays a faint pattern of window light on the wall behind, with gentle fill in the eye sockets and small natural catchlights. The setting is a real lived-in interior in warm beige and cream, a window frame and a plant thrown well out of focus behind the person. Use a 50mm portrait perspective and keep the warm color warm, with delicate tonal transitions. Skin looks clear and luminous with fine believable texture and restrained retouching, not waxy smoothing and not forensic pores. Natural lip color and subtle age-appropriate grooming; relaxed, refined presence. No harsh overhead shadows, no gritty HDR, and never an empty studio backdrop.'),
  ('a1111111-0000-4000-8000-000000000002'::uuid,
   'A cinematic Korean drama portrait at blue hour beside a window, city lights falling into soft round bokeh behind the person. A warm amber edge light rims the hair and jaw against cool blue ambient tones, while a broad soft fill keeps the eyes, skin and identity clearly readable. Use gentle contrast, a portrait-lens perspective, subtle film grain and smooth highlight rolloff. Commit to the warm-against-cool color rather than flattening it toward grey. Refined actor-like styling, natural luminous skin and delicate real texture. The mood is intimate and elegant rather than gritty or weathered. Avoid crushed facial shadows, heavy grain and black letterbox bars.'),
  ('a1111111-0000-4000-8000-000000000003'::uuid,
   'A high-end Korean fashion and beauty editorial portrait in a minimal studio. The person stands near a plain pale grey wall so their own soft shadow falls across it and gives the frame depth. Light arrives from the front-left and sculpts the cheekbone and jaw, while gentle fill keeps the eye sockets open and the catchlights clean. Styling is contemporary and high-contrast: a single deep or saturated garment against the pale wall. Use an 85mm portrait-lens perspective with precise focus on the eyes and subtle background separation. Magazine-quality color and restrained professional retouching preserve fine skin texture and individual facial features; the skin is clear and softly luminous, not plastic, over-sharpened or heavily contoured.'),
  ('a1111111-0000-4000-8000-000000000004'::uuid,
   'A Korean lifestyle snapshot on the street outside a quiet cafe on a sunny late afternoon, with the effortless styling of a carefully chosen social portrait. Low warm backlight glows through the hair and flares gently at the edge of the frame, while soft daylight bouncing off the pavement fills the face evenly. The cafe window, wooden benches and street trees sit behind in warm golden bokeh, with no distracting objects. Casual contemporary clothing, a relaxed spontaneous pose caught mid-turn, natural complexion and a fresh well-rested expression consistent with the selected mood. Use a natural smartphone perspective without close-range wide-angle facial distortion, and keep the golden warmth instead of neutralizing it. Keep the face clearly exposed, without blown highlights, heavy shadows or gritty texture.')
) as revised(id, prompt)
where option.id = revised.id and option.kind = 'tone';
