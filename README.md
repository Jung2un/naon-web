# AI 대역 — 웹 관리 화면

내 대신 연기하는 AI 캐릭터 앱의 **웹 관리 화면**.
2026-09-16 · 솔로 개발

---

## TODO — 다음에 할 것

웹 코드(S0~S9)는 만들어져 있고 `npm run build`가 통과한다.
아래는 **계정이 있어야 되는 일**이라 아직 못 한 것들. 위에서부터 순서대로 하면 된다.

### 0. 계정 전환 — 이게 먼저다

- [x] Claude Desktop / Claude Code를 **개인 계정**으로 전환 — 완료
  - 아래 1~4의 리소스는 개인 계정 소유여야 한다. 나중에 옮기기 어렵다

### 1. Supabase — 거의 끝났다

프로젝트: **`ai-web`** · ref **`alafyhejiaxukrkrmehh`** · 리전 `ap-northeast-2`(서울) · 조직 `Jung2un`

CLI는 레포에 devDependency로 들어 있다. 전역 설치 필요 없이 `npx supabase …`로 쓴다.
`supabase link`는 이미 걸려 있다.

- [x] 프로젝트 생성 — 리전 `ap-northeast-2` 확인됨 (나중에 못 바꾼다)
- [x] `Project URL` · `anon key` · `ref` — `npx supabase projects api-keys --project-ref <ref>`로 언제든 꺼낸다
- [x] `supabase db push` — 마이그레이션 4개 적용 완료 (init · ledger_reasons · presets_seed · credit_functions)
- [x] `supabase gen types typescript --linked > src/types/database.ts` — 손으로 옮겨 적던 상태를 실제 생성물로 교체. 빌드 통과
- [x] `presets` 테이블 시드 — 16종(머리·상의·하의·장소 각 4) 마이그레이션으로 들어감. id 고정
- [x] Vercel 환경변수 등록 — 3번에서 완료 (Production / Preview / Development 전부)
- [ ] `presets` 버킷에 썸네일 업로드 — **이미지가 아직 없다.** 지금은 이름만 나온다
      경로는 DB에 미리 적혀 있다(`hair/1.jpg` … `scene/4.jpg`). 같은 경로로 올리면 SQL을 안 건드려도 붙는다.
      presets 버킷에는 INSERT 정책이 없다 — 대시보드나 service_role로 올린다

> 로컬 `.env.local`에 Supabase 값을 채우면 `isSupabaseConfigured`가 켜져서 고정 데이터가 꺼지고
> 실제 로그인을 요구한다. OAuth(2번)가 끝나기 전에는 `/login`에서 막히니 그때 채우는 게 맞다.
> (`vercel link`가 만든 `.env.local`에는 OIDC 토큰만 있고 Supabase 값은 없다.)

### 2. OAuth

- [x] **Google Cloud** OAuth 클라이언트 생성 — 완료. Supabase에서 google 공급자가 켜진 것까지 확인했다
      (`/auth/v1/settings`의 external이 google만 true, email은 false)
  - 승인된 리디렉션 URI는 이것 **하나만**: `https://alafyhejiaxukrkrmehh.supabase.co/auth/v1/callback`
  - 우리 도메인을 여기 넣는 게 아니다. 자주 틀리는 지점
  - 결제 계정은 필요 없다. `cloud.google.com/free`(카드 등록 안내)로 가지 말 것
  - 콘솔 바로가기: 프로젝트 생성 `console.cloud.google.com/projectcreate` →
    동의 화면 `console.cloud.google.com/auth/overview` →
    클라이언트 `console.cloud.google.com/auth/clients` →
    테스트 사용자 `console.cloud.google.com/auth/audience`
  - 앱이 "테스트" 상태인 동안에는 테스트 사용자에 등록된 계정만 로그인된다
  - client ID/secret → Supabase → Authentication → Providers → Google
- [ ] **Kakao** 개발자 앱 생성 — 아직. 지금은 로그인 화면에서 "곧 열려요"로 비활성이다 → Supabase → Providers → Kakao 활성화
  - 버튼·로고·색은 이미 만들어져 있다 (`src/components/app/OAuthButton.tsx`)
  - 켠 뒤 `src/lib/auth-providers.ts`에서 kakao의 `status`를
    `"preparing"` → `"ready"` **한 단어만** 바꾸면 동작한다
- [x] Supabase → Authentication → URL Configuration — **완료**
  - `supabase/config.toml`에 적고 `npx supabase config push`로 반영했다. 대시보드에서 손으로 고치지 말 것 —
    다음 push가 이 파일 값으로 되돌린다
  - Site URL `https://ai-daeyeok.vercel.app` · Redirect URLs는 운영 + 프리뷰 와일드카드
  - 로컬을 안 쓰기로 해서 `localhost` 줄은 넣지 않는다

### 3. Vercel — 끝났다

프로젝트 **`ai-daeyeok`** (`jung2uns-projects`) · 운영 URL **https://ai-daeyeok.vercel.app**

- [x] GitHub 레포 생성 — `Jung2un/ai-daeyeok-web` (private)
- [x] Vercel에 Import — `vercel link`가 GitHub 레포까지 자동 연결했다. main에 push하면 배포된다
- [x] Supabase 환경변수 두 개 등록 — Production / Preview / Development 전부
- [x] 함수 리전 `icn1` — `vercel.json`
- [x] 프로덕션 배포 완료. `/` → `/login`(307), `/dashboard` → `/login?next=/dashboard` 확인
- [x] **실제 URL이 `ai-daeyeok.vercel.app`으로 잡혔다** — `site-url.ts`의 `PRODUCTION_URL`을 고칠 필요가 없었다

### 4. Edge Function — 코드는 다 나왔다. fal 계정만 남았다

- [x] `create-character` — 2크레딧 차감 + `characters`/`character_refs` INSERT + fal 큐 등록
- [x] `create-look` — 1크레딧 차감 + 프리셋 슬롯 검증 + `looks` INSERT + fal 큐 등록
- [x] 변환 완료 웹훅 (`fal-webhook`) — 조건부 상태 전이, 결과를 우리 버킷으로, 실패 시 환불
- [x] `WEBHOOK_SECRET` 시크릿 등록 — 웹훅 위조 방지 HMAC 키
- [x] 세 함수 배포 완료 (`npx supabase functions deploy`)
- [ ] `npx supabase secrets set FAL_KEY=... FAL_CHARACTER_MODEL=... FAL_LOOK_MODEL=...`
      (**Vercel에 넣지 말 것.** 모델을 고르기 전에는 함수가 차감 전에 503으로 막는다)

> **지켜볼 것 — 함수 게이트웨이 404.** 배포 직후, 같은 요청을 반복하면 절반쯤이
> `{"code":"NOT_FOUND"}`로 떨어진다. 나머지 절반은 설계대로 401/400을 준다.
> 404 응답에는 `x-deno-execution-id`가 없다 — 워커에 닿기도 전에 게이트웨이가 끊는다는 뜻이라
> 우리 코드 문제가 아니다. 재배포로도 안 바뀌었다. 새 프로젝트의 함수 레지스트리가
> 게이트웨이 인스턴스 사이에 덜 퍼진 것으로 보인다. 계속되면 Supabase 지원에 문의할 것.

함수를 고칠 때 알아야 할 것들. 전부 코드에서 읽어낸 값이라 추측이 아니다.

**호출 계약** — 화면이 이미 이 모양으로 부른다. 바꾸면 화면도 같이 고쳐야 한다.

| 함수 | body | 응답 | 부르는 곳 |
|---|---|---|---|
| `create-character` | `{ name, refs: { front, left45, right45, left90, right90 } }` (값은 Storage 경로) | `{ character_id }` | `CharacterForm.tsx:98` |
| `create-look` | `{ character_id, name, hair_preset_id, top_preset_id, bottom_preset_id, scene_preset_id }` | `{ look_id }` | `LookBuilder.tsx:78` |

**크레딧 값** — 화면에 이미 박혀 있다. 함수도 같은 값을 써야 한다.

| 행위 | 비용 | 원장 사유 | 화면 |
|---|---|---|---|
| 캐릭터 만들기 | **2** | `character_charge` | `CharacterForm.tsx:20` |
| 룩 만들기 | **1** | `look_charge` | `LookBuilder.tsx:24` |
| 영상 변환 | **1** | `job_charge` | 앱 쪽 |

**차감은 SQL 함수로 한다. 이건 이미 만들어져 있고 DB에 올라가 있다.**
`charge_credits(user_id, amount, reason, job_id, memo)` · `refund_credits(...)`
— `supabase/migrations/20260916000004_credit_functions.sql`

`update ... where credits >= ? returning credits` 한 문장으로 확인과 차감을 끝내고
같은 트랜잭션에서 `credit_ledger`에 남긴다. **잔액이 모자라면 예외가 아니라 `null`을 돌려준다** —
호출부가 문자열을 비교하지 않게 하려는 것이다. 실행 권한은 `service_role`에만 있다.

**웹훅 멱등성.** fal이 같은 알림을 두 번 보낼 수 있다. 상태 전이를 조건부로 걸어
(`update ... where status <> 'failed' returning id`) 행이 안 돌아오면 환불을 건너뛴다.
`credit_ledger.job_id`는 `jobs`만 가리켜서 캐릭터·룩 환불은 이 방식으로 막아야 한다.

**되돌아올 주소.** fal 콜백에 어느 행인지 실어야 한다. 스키마를 안 건드리려면
웹훅 URL에 `?type=character&id=<uuid>&token=<HMAC>`을 달고 공유 시크릿으로 검증한다.

**아직 못 정한 것 — fal.ai 모델 ID.** `docs/배포.md`에 영상용 Wan-Animate Replace만 있고,
캐릭터(5각도 → 캐릭터 이미지)와 룩(프리셋 4슬롯 → 스타일 이미지)에 쓸 모델은 정해진 적이 없다.
지어내지 말고 fal 콘솔에서 고른 뒤 `FAL_CHARACTER_MODEL` / `FAL_LOOK_MODEL` 시크릿으로 넣을 것.

모델이 정해지면 **코드에서 고칠 곳은 두 군데뿐**이다.
`create-character`의 `{ image_urls, prompt }`와 `create-look`의 `{ image_url, prompt }` —
지금 값은 고른 모델의 입력 스키마에 맞춰야 한다. 그리고 응답 모양이 확정되면
`_shared/fal.ts`의 `resultUrl()`이 여러 모양을 훑는 대신 그 모델의 모양 하나만 보게 줄인다.

**에러 코드는 `src/lib/errors.ts`에 있는 것만 쓴다.** 화면이 그 코드만 사람 말로 바꾼다.
없는 코드를 던지면 "문제가 생겼어요"라는 기본 문구로 떨어진다.
`INSUFFICIENT_CREDITS` · `REF_INCOMPLETE` · `SESSION_EXPIRED` · `UPSTREAM_ERROR` 등.

### 5. 마감 (S9~S10)

- [~] 375px 가로 스크롤 — `/login`과 `/kitchen-sink`는 실제 브라우저에서 확인했다
      (둘 다 `scrollWidth === clientWidth === 375`). kitchen-sink의 표는 `min-w-[520px]`이지만
      자체 스크롤 컨테이너 안이라 페이지는 안 밀린다. **로그인 후 화면은 아직 못 봄**
- [ ] 크레딧 0인 계정으로 전 화면 돌아보기
- [ ] job을 일부러 실패시켜 에러 문구가 사람 말로 나오는지 확인
- [ ] 커스텀 도메인 + Google 동의 화면 프로덕션 게시
- [ ] 결제 켜기 전에 **Vercel Pro 전환** (Hobby는 비상업용 전용)

### 나중에

- [ ] 결제 (토스/Stripe) — S10 이후 별도
- [ ] 파일 1GB / egress 5GB 근접하면 Supabase Pro, 그 뒤 `videos`만 R2로

---

## 없는 문서

`CLAUDE.md`·`DESIGN.md`·이 파일이 참조하는데 **실제로는 없는** 파일이 둘 있다.

| 파일 | 원래 내용 | 지금 |
|---|---|---|
| `docs/기획서.md` | 화면·데이터 모델·RLS | 없음. README의 S0~S10 + CLAUDE.md 9규칙 + DESIGN.md 컴포넌트 명세에서 복원해 만들었다 |
| `docs/claude-code-프롬프트.md` | S0~S10 붙여넣기용 | 없음. S0~S9는 이미 만들어져서 당장은 필요 없다 |
| ~~`CLAUDE.md`의 9규칙~~ | 아키텍처 규칙 1~9 | **복원했다.** 코드 주석 열 곳이 가리키던 자리에서 되살렸다 |

원본이 남아 있으면 넣어두는 게 좋다. 데이터 모델이 기획서와 다르면 마이그레이션부터 어긋난다.

---

## 파일

```
프로젝트루트/
├── README.md                      이 파일
├── CLAUDE.md                      매 세션 규칙 — Claude Code가 자동으로 읽는다
├── DESIGN.md                      디자인 시스템 (Lovable 기반, 번역 완료본)
├── docs/
│   └── 배포.md                     어디에 올리는가 — 호스팅·환경변수·비용
├── supabase/migrations/           스키마 + RLS
└── src/
    ├── app/                       화면 (App Router)
    ├── components/ui/             버튼·카드·입력·표 — DESIGN.md §6
    ├── components/app/            StatusBadge · JobCard · CreditStrip · PresetTile …
    ├── lib/supabase/              @supabase/ssr 클라이언트 (client / server / proxy)
    ├── lib/site-url.ts            운영 URL이 코드에 있는 유일한 자리
    └── lib/auth-providers.ts      OAuth 공급자 배열 (Google · Kakao)
```

| 파일 | 누가 읽나 | 언제 |
|---|---|---|
| `CLAUDE.md` | Claude Code (자동) | 매 세션 |
| `DESIGN.md` | Claude Code | 화면을 만들 때 |
| `docs/배포.md` | 나 | 계정 세팅할 때, 비용이 궁금할 때 |

`DESIGN.md`는 Lovable 원본이 아니라 이 프로젝트용으로 이미 번역된 버전이니 원본을 따로 받지 마라.

---

## 지금 돌려보기

```bash
npm install
npm run dev     # http://localhost:3300
```

Supabase 환경변수가 비어 있으면 데이터 레이어가 **타입만 같은 고정 데이터**를 돌려준다
(`src/lib/data/fixtures.ts`). 환경변수를 채우면 같은 화면이 실제 데이터로 바뀐다.

`/kitchen-sink`에 토큰과 컴포넌트가 한 화면에 모여 있다.

> 포트가 3000이 아니라 **3300**인 이유: 3000은 다른 프로세스가 IPv6 쪽(`::1`)을 잡고 있어서
> 브라우저가 그쪽으로 붙는다. `package.json`의 `dev`에 `-p 3300`으로 고정해 뒀다.

자세한 계정 세팅 절차는 `docs/배포.md` §3. 단 Redirect URL은 localhost가 아니라
위 TODO 2번의 고정 Vercel URL을 쓴다.

---

## 이미 정해진 것

지난 논의에서 확정된 판단들. 다시 흔들지 말고, 흔들 거면 왜 정해졌는지 먼저 볼 것.

| 결정 | 이유 |
|---|---|
| 웹은 **관리 화면**. 촬영은 앱 | 설계서의 역할 분담. 웹을 먼저 끝내면 데이터 모델이 굳어서 앱이 얇아진다 |
| **Next.js** App Router | 설계서에 이미 확정. 서버 컴포넌트로 Supabase를 직접 읽으면 전역 상태가 사라진다 |
| **Supabase**를 처음부터 | DB·인증·스토리지·Realtime·Edge Function이 한 벌 |
| 인증은 **OAuth만** (Google → Kakao) | 비밀번호를 받으면 재설정·이메일 인증·유출 대응이 전부 따라온다 |
| 호스팅은 **Vercel** (`icn1`) | 백엔드가 이미 Supabase에 있어서 돌릴 서버가 없다 |
| 캐릭터 레퍼런스 **5각도** | 정면/좌우45/좌우90. 씬 표준 (레퍼런스 분석 8번) |
| 룩은 **프리셋 슬롯만**, 자유 프롬프트 없음 | 설계서 결정. 흔들면 원가와 품질이 같이 무너진다 |
| **다크 모드 안 만듦** | 크림 배경이 디자인 시스템의 정체성이다 |
| MVP 스토리지는 **Supabase 하나** | R2 이관은 파일 1GB / egress 5GB가 신호 |

---

## 만들 순서

| # | 세션 | 끝나면 보이는 것 | 상태 |
|---|---|---|---|
| S0 | 프로젝트 초기화 | 빈 Next 앱이 뜬다 | 완료 |
| S1 | **디자인 토큰** | `/kitchen-sink`가 Lovable 톤으로 보인다 | 완료 |
| S2 | Supabase 스키마 + RLS | 마이그레이션이 돌고 타입이 생성된다 | 완료 — push·타입 생성까지 |
| S3 | 인증 (Google OAuth) | 구글 계정으로 로그인된다 | 코드 완료 · **공급자 설정 아직** |
| S4 | 앱 셸 + 빈 대시보드 | 사이드바와 온보딩 화면 | 완료 |
| S5 | 캐릭터 | 목록·생성·상세 | 화면 완료 · **생성은 Edge Function 필요** |
| S6 | 룩 | 프리셋 4슬롯 선택과 채택 | 화면 완료 · **생성은 Edge Function 필요** |
| S7 | 작업물 | 목록·상세·Realtime 상태 갱신 | 완료 |
| S8 | 크레딧 + Edge Function | 실제 차감이 일어난다 | 화면·원장 완료 · **함수 아직** |
| S9 | 마감 | 빈 상태·에러·모바일·접근성 | 빈 상태·에러 완료 · **375px 미확인** |
| S10 | 배포 정리 | 운영 도메인에서 전부 돈다 | 배포는 떴다 · **로그인은 OAuth 대기** |

**S1이 끝나기 전에는 화면을 만들지 않는다.** 토큰이 자리잡기 전에 화면이 생기면 나중에 전부 다시 칠하게 된다.

남은 건 위 TODO에 있다. 결제(토스/Stripe)는 S10 이후 별도.

---

## 돈이 나가기 시작하는 순간

| 언제 | 얼마 |
|---|---|
| **결제 기능을 켤 때** | Vercel Pro **$20/월** — Hobby는 비상업용 전용이다 |
| 파일 1GB · egress 5GB · DB 500MB 중 하나 초과 | Supabase Pro **$25/월** |
| 첫 변환부터 | fal.ai 종량제 (설계서 원가표) |

합쳐 **월 $45**. ₩24,900 구독 기준 **2.7명**이면 인프라가 자립한다.
지금 당장은 전부 $0로 개발할 수 있다. 자세한 건 `docs/배포.md` §7.

---

## 자주 틀리는 세 곳

1. **Supabase Redirect URLs에 프리뷰 와일드카드가 빠짐** → Vercel 프리뷰 URL은 배포마다 바뀐다. `https://ai-daeyeok-*.vercel.app/**`를 넣어야 한다. 안 넣으면 프리뷰에서 로그인이 전부 막히고 원인을 코드에서 찾게 된다.
2. **Google에 우리 도메인을 등록함** → 거기 들어가는 건 `https://<ref>.supabase.co/auth/v1/callback`이다. 우리 도메인은 Supabase 쪽 허용목록에 넣는다.
3. **함수 리전을 기본값으로 둠** → `iad1`(워싱턴)이라 서울 Supabase까지 태평양을 왕복한다. `icn1`로 고정할 것.

---

## 다음 단계 (이 문서 밖)

설계서의 **$1 검증**이 아직 안 끝났다면 그게 먼저다 — 셀피로 캐릭터 이미지 한 장 만들고, 폰으로 10초 찍고, fal.ai 콘솔에서 Wan-Animate Replace에 넣어보기. 여기에 joyosapp을 설치해 같은 소스로 돌려 나란히 비교하면 품질 기준선이 생긴다.

결과가 인스타에 올릴 수준이면 위 S0부터 시작하고, 아니면 웹을 짓기 전에 방향부터 다시 본다.
