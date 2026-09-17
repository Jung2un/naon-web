@AGENTS.md

# AI 대역 — 매 세션 규칙

이 파일은 **복원본이다.** 원본이 사라진 뒤, 코드 주석이 가리키던 자리
(`— CLAUDE.md 아키텍처 규칙 N`)와 README·마이그레이션 주석에서 되살렸다.
번호는 주석이 실제로 쓰고 있는 번호라 **바꾸면 안 된다.**

각 규칙 옆의 파일이 그 규칙이 이미 적용돼 있는 자리다. 새로 쓰는 코드는 그 파일을 보고 맞춘다.

---

## 아키텍처 규칙

**1. 데이터 읽기는 전부 서버 컴포넌트에서.** — `src/lib/data/queries.ts`
클라이언트에서 fetch 해서 useState에 담지 않는다. 서버에서 읽어 props로 내려보내면
전역 상태가 필요 없어진다. 클라이언트 컴포넌트는 입력과 상호작용만 맡는다.

**2. 돈이 움직이거나 GPU가 도는 행위는 Edge Function만 한다.**
— `supabase/migrations/…_init.sql` · `CharacterDraftForm.tsx` · `CharacterStudio.tsx` · `LookBuilder.tsx`
클라이언트는 `characters` · `character_images` · `looks` · `jobs`에 직접 INSERT 하지 않고
`profiles.credits`를 건드리지 않는다. anon 키로 가능한 건 SELECT와 본인 소유 row의 제한된
UPDATE/DELETE뿐이다. INSERT 정책이 아예 없는 것이 이 규칙의 강제 수단이다.
돈도 GPU도 안 쓰는 행위(후보 고르기·되돌리기)는 예외로 SQL 함수를 쓴다 — `docs/기획서.md` §6.

**3. RLS 없는 테이블을 만들지 않는다.** — `supabase/migrations/…_init.sql`
테이블을 만들면 **같은 파일에** 정책도 같이 쓴다. 나중에 붙이겠다고 미루면 안 붙는다.

**4. private 버킷. 읽기는 서버가 만든 signed URL로만 나간다.** — `src/lib/storage.ts`
클라이언트에 버킷 경로를 그대로 노출하지 않는다. DB에는 경로 문자열만 들고,
URL은 서버에서 만료 1시간짜리로 만들어 붙인다.
(영상만 R2로 옮길 때 고쳐야 하는 곳이 이 파일 하나다. — `docs/배포.md` §6)
예외는 톤·프리셋 카탈로그 그림뿐이다. 사용자 파일이 아니라 모두가 같이 보는 고정 그림이라
`public/catalog/`에 앱과 같이 싣는다. — `src/lib/catalog.ts`

**5. `src/types/database.ts`는 손으로 고치지 않는다.** — `src/types/database.ts`
`supabase gen types typescript`의 출력물이다. 화면에서 쓰는 타입은 전부
`src/types/models.ts`에서 이 파일로부터 파생시킨다. 스키마를 바꿨으면 마이그레이션을
올리고 타입을 다시 생성한다.

**6. 인증은 OAuth 2.0만. 비밀번호 로그인을 만들지 않는다.** — `src/lib/auth-providers.ts`
비밀번호를 받으면 재설정·이메일 인증·유출 대응이 전부 따라온다. 솔로 개발에서 질 싸움이다.

**7. 리다이렉트 파라미터는 검증한다.** — `src/lib/site-url.ts`의 `safeNextPath`
`/`로 시작하고 `//`·`/\`로 시작하지 않는 상대 경로만 허용한다. 안 막으면 오픈 리다이렉트다.

**8. origin은 항상 `src/lib/site-url.ts`를 거친다.** — `src/lib/site-url.ts`
컴포넌트나 라우트 핸들러에서 URL을 직접 쓰지 않는다. 운영 URL이 코드에 있는 자리는
`PRODUCTION_URL` 한 줄뿐이고, 도메인을 바꿀 때 고치는 곳도 거기 하나다.

**9. 웹에 존재해도 되는 환경변수는 둘뿐이다.** — `src/lib/env.ts`
`NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
`SUPABASE_SERVICE_ROLE_KEY` · `GEMINI_API_KEY` · `FAL_KEY`는 **Supabase Edge Function 시크릿에만** 둔다.
Vercel에 없으면 실수로 클라이언트 번들에 섞일 경로 자체가 사라진다.

---

## 문구 규칙

**에러는 사람 말로.** — `src/lib/errors.ts`
`FAL_422` 같은 코드를 화면에 그대로 내보내지 않는다. 새 에러를 던질 거면
`errors.ts`의 `MESSAGES`에 문구부터 추가한다. 없는 코드를 던지면 "문제가 생겼어요"라는
기본 문구로 떨어진다.

무엇이 잘못됐는지가 아니라 **다음에 뭘 하면 되는지**를 적는다.
"얼굴이 프레임을 벗어난 구간이 있어요. **다시 찍어 주세요.**"

---

## 화면을 만들 때

`DESIGN.md`를 먼저 읽는다. 토큰·간격·컴포넌트 명세가 거기 있다.
**캐릭터 만들기를 건드릴 거면 `docs/기획서.md`가 먼저다** — 흐름·데이터 모델·크레딧이 거기 있다.
크림 배경(`#f7f4ed`) 위 차콜(`#1c1c1c`). **순백을 페이지 배경으로 쓰지 않는다.**
다크 모드는 만들지 않는다 — 크림 배경이 이 디자인 시스템의 정체성이다.
색 규칙이 면제되는 유일한 자리는 OAuth 브랜드 버튼이다 (각 사 가이드라인을 따라야 한다).

---

## 마이그레이션

**추가만 한다.** 컬럼을 지우거나 이름을 바꾸는 마이그레이션은 만들지 않는다.
컬럼을 없애야 하면 코드에서 먼저 안 쓰게 만들고, 한참 뒤에 지운다.
배포 순서는 **마이그레이션이 먼저, 코드가 나중**이다. 반대로 하면 새 코드가 없는 컬럼을 찾는다.
— `docs/배포.md` §8 · §10
