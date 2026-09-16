# AI 대역 — 웹 관리 화면

내 대신 연기하는 AI 캐릭터 앱의 **웹 관리 화면**.
2026-09-16 · 솔로 개발

---

## TODO — 남은 것

2026-09-16에 계정 세팅(Supabase · Google OAuth · Vercel)과 Edge Function을 끝냈다.
**끝난 내용은 이 문서 아래 "끝난 것"에 있다.** 여기는 아직 안 된 것만 둔다.

| 막는 것 | 누가 | 없으면 |
|---|---|---|
| **스튜디오 push·배포** | 아래 E번 | 캐릭터 만들기 화면이 없는 테이블을 찾는다 |
| **fal.ai 모델 네 개** | 결정이 필요하다 | 캐릭터·룩 만들기가 503에서 멈춘다 |
| 카카오 개발자 앱 | 계정 작업 | 로그인 화면에서 "곧 열려요"로 비활성 |
| 프리셋 썸네일 16장 + 톤 6장 | 이미지가 필요하다 | 프리셋·톤이 이름만 나온다 |

### A. fal.ai — **가장 큰 구멍. 결정이 안 됐다**

`docs/배포.md`에 영상용 **Wan-Animate Replace**만 있고,
캐릭터(톤 → 후보 → 수정 → 3방향)와 룩(프리셋 4슬롯 → 스타일 이미지)에 쓸 모델은
설계 어디에도 정해진 적이 없다. **지어내지 말 것.** fal 콘솔에서 골라야 한다.
어떤 모델이 어디에 들어가는지는 `docs/기획서.md` §7.

- [ ] fal.ai 계정 + 결제 수단 (종량제라 첫 변환부터 돈이 나간다)
- [ ] 후보용 — 프롬프트 → 이미지 1장 (text-to-image)
- [ ] 수정용 — 이미지 + 지시문 → 이미지 1장. **얼굴이 유지되는 편집 모델이어야 한다**
- [ ] 각도용 — 이미지 + 지시문 → 이미지 1장 (수정용과 같은 모델이어도 된다)
- [ ] 룩용 — 캐릭터 이미지 1장 + 프리셋 4개(텍스트) → 이미지 1장
- [ ] 시크릿 등록

```bash
npx supabase secrets set FAL_KEY=... FAL_CHARACTER_DRAFT_MODEL=... FAL_CHARACTER_EDIT_MODEL=... FAL_CHARACTER_VIEW_MODEL=... FAL_LOOK_MODEL=...
```

**Vercel에 넣지 말 것.** 시크릿이 없는 동안에는 함수가 **크레딧을 깎기 전에** 503으로 막는다
(`falConfig()`가 null이면 차감 앞에서 돌아선다). 모델을 고르기 전에 버튼을 눌러도 크레딧이 안 날아간다.

**모델이 정해지면 코드에서 고칠 곳은 세 군데뿐이다.**

| 자리 | 지금 | 해야 할 일 |
|---|---|---|
| `_shared/fal.ts`의 `characterInput()` | `{ prompt }` · `{ image_url, prompt }` | 고른 모델의 입력 스키마로. **세 함수가 다 이 한 곳을 쓴다** |
| `create-look/index.ts` | `{ image_url, prompt }` | 고른 모델의 입력 스키마로 |
| `_shared/fal.ts`의 `resultUrl()` | 흔한 응답 모양 여럿을 훑는다 | 그 모델의 모양 하나만 보게 줄인다 |

> **지켜볼 것 — 함수 게이트웨이 404.** 배포 직후부터, 같은 요청을 반복하면 40~60%가
> `{"code":"NOT_FOUND"}`로 떨어진다. 나머지는 설계대로 401/400을 준다.
> 404에는 `x-deno-execution-id`가 **없다** — 워커에 닿기 전에 게이트웨이가 끊는다는 뜻이라
> 우리 코드 문제가 아니다. 재배포로도 안 바뀌었다.
> 실제로 함수를 쓰기 시작할 때까지 안 풀리면 `sb-request-id`를 들고 Supabase 지원에 문의할 것.

### B. 카카오 로그인

Google과 같은 자리에 붙인다. 버튼·로고·색은 이미 만들어져 있다 (`src/components/app/OAuthButton.tsx`).

- [ ] Kakao Developers에서 앱 생성 → 카카오 로그인 활성화
- [ ] Redirect URI 등록 — 구글과 **같은 값** `https://alafyhejiaxukrkrmehh.supabase.co/auth/v1/callback`
- [ ] 보안 메뉴에서 Client Secret 생성 + **사용함**으로 (Supabase가 secret을 요구한다)
- [ ] Supabase → Authentication → Providers → Kakao 에 **REST API 키**와 Client Secret
- [ ] `src/lib/auth-providers.ts`에서 kakao의 `status`를 `"preparing"` → `"ready"` (한 단어)

> 걸리기 쉬운 곳: 동의항목. 닉네임은 기본으로 받지만 **이메일은 비즈 앱 전환이 필요할 수 있다.**
> 이메일 동의를 필수로 걸어두면 심사 전에는 로그인이 막힌다. 선택으로 두거나 닉네임만으로 시작할 것.

### C. 프리셋 썸네일 16장

경로는 DB에 이미 적혀 있다. 같은 이름으로 올리면 SQL을 안 건드려도 붙는다.

- [ ] `presets` 버킷에 `hair/1.jpg` … `scene/4.jpg` (머리·상의·하의·장소 각 4장)
- `presets` 버킷에는 INSERT 정책이 없다 — 대시보드나 service_role로 올린다
- 파일이 없는 동안에는 signed URL이 null이라 `PresetTile`이 이름만 그린다. 깨지지 않는다

### D. 마감 (S9~S10)

- [x] **로그인 후 화면들 확인 완료** — 실제 계정으로 대시보드·캐릭터·룩·룩 만들기·작업물·크레딧·설정·캐릭터 만들기.
      전부 빈 상태가 제대로 나온다. 가입 흐름도 통째로 검증됐다 —
      프로필 자동 생성, 보너스 15크레딧, 원장에 "가입 보너스 +15 / 잔량 15"
- [x] **375px 가로 스크롤 없음 — 전 화면 확인**. 375px iframe에서 실측했고
      모든 라우트가 `scrollWidth === clientWidth === 375`다.
      `/credits`·`/kitchen-sink`의 표는 `min-w-[520px]`로 545px까지 뻗지만
      자체 스크롤 컨테이너 안이라 페이지는 안 밀린다 — 의도된 패턴
- [ ] 프리셋 그리드는 아직 눈으로 못 봤다. `/looks/new`가 "쓸 수 있는 캐릭터가 없어요"에서 멈춰서
      `PresetTile` 16개가 그려지는 화면까지 못 간다. **캐릭터가 하나 생겨야 볼 수 있다 → fal 대기**
- [ ] 크레딧 0인 계정으로 전 화면 돌아보기
- [ ] job을 일부러 실패시켜 에러 문구가 사람 말로 나오는지 확인 (fal이 붙은 뒤에 된다)
- [ ] 커스텀 도메인 + Google 동의 화면 프로덕션 게시
- [ ] 결제 켜기 전에 **Vercel Pro 전환** (Hobby는 비상업용 전용)

### E. 캐릭터 스튜디오 올리기 — **이번 개편. 코드는 됐고 올리는 게 남았다**

`docs/기획서.md`대로 캐릭터 만들기를 다시 지었다(톤 → 후보 4장 → 다듬기 → 3방향).
**마이그레이션이 먼저, 코드가 나중이다.** — `docs/배포.md` §8

```bash
npx supabase login
npx supabase db push
npx supabase gen types typescript --linked > src/types/database.ts
npx supabase functions deploy draft-character refine-character build-character fal-webhook create-look
```

- [ ] 마이그레이션 3개 push — `character_ledger_reasons` · `character_studio` · `character_options_seed`
- [ ] 타입 재생성 (`src/types/database.ts`는 손으로 고치지 않는다 — CLAUDE.md 규칙 5)
- [ ] 함수 배포. `create-character`는 없어졌으니 대시보드에서 지운다
- [ ] 톤 썸네일 6장 (`presets` 버킷 `tone/1.jpg` … `tone/6.jpg`) — 없으면 이름만 나온다

### 나중에

- [ ] 결제 (토스/Stripe) — S10 이후 별도
- [ ] 파일 1GB / egress 5GB 근접하면 Supabase Pro, 그 뒤 `videos`만 R2로

---

## 끝난 것 — 2026-09-16

다시 안 해도 되는 것들. 값이 필요하면 여기서 찾는다.

**Supabase** — 프로젝트 `ai-web` · ref `alafyhejiaxukrkrmehh` · 리전 `ap-northeast-2`(서울) · 조직 `Jung2un`

- CLI가 레포에 devDependency로 들어 있다. 전역 설치 없이 `npx supabase …`. link는 걸려 있다
- 마이그레이션 4개 적용 — `init` · `ledger_reasons` · `presets_seed` · `credit_functions`
- `src/types/database.ts`는 이제 진짜 생성물이다 (`gen types typescript --linked`). 손으로 고치지 않는다
- 프리셋 16종 시드 완료. id 고정이라 환경 사이에서 참조가 유지된다
- `charge_credits` / `refund_credits` — 확인과 차감이 SQL 한 문장. 잔액 부족은 예외가 아니라 `null`.
  실행 권한은 `service_role`에만
- API 키가 필요하면 `npx supabase projects api-keys --project-ref alafyhejiaxukrkrmehh`

**인증** — Google만 켜져 있다 (`/auth/v1/settings`에서 external.google만 true, email은 false)

- Google 승인된 리디렉션 URI는 `https://alafyhejiaxukrkrmehh.supabase.co/auth/v1/callback` 하나
- 동의 화면은 아직 "테스트" 상태다. 등록된 테스트 사용자만 로그인된다
- **Site URL·Redirect URLs는 `supabase/config.toml`이 원본이다.** 대시보드에서 손으로 고치지 말 것 —
  다음 `npx supabase config push`가 이 파일 값으로 되돌린다.
  무관한 값들은 원격 현재 값에 맞춰 놨으니, 새 값을 바꿀 때는 `config diff`로 먼저 볼 것

**Vercel** — 프로젝트 `ai-daeyeok` (`jung2uns-projects`) · https://ai-daeyeok.vercel.app

- GitHub 레포가 연결돼 있다. `main`에 push하면 배포된다
- `NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_ANON_KEY`가 Production/Preview/Development 전부에
- 함수 리전 `icn1` (`vercel.json`)
- 운영 URL이 `ai-daeyeok.vercel.app`으로 잡혀서 `site-url.ts`의 `PRODUCTION_URL`을 고칠 일이 없었다

**Edge Function** — `create-look`·`fal-webhook`은 배포됨.
**캐릭터 3종은 아직 안 올라갔다 — 위 E번.**

| 함수 | 하는 일 | JWT |
|---|---|---|
| `draft-character` | 1크레딧 · 톤·속성 검증 · `characters` + 후보 4행 INSERT · fal 큐 4번 | 검증함 |
| `refine-character` | 1크레딧 · **바뀐 속성만** 지시문으로 · 수정본 1행 · fal 큐 | 검증함 |
| `build-character` | 2크레딧 · 3방향 3행 · fal 큐 3번 | 검증함 |
| `create-look` | 1크레딧 · 프리셋 슬롯 검증 · `looks` INSERT · fal 큐 | 검증함 |
| `fal-webhook` | 조건부 상태 전이 · 결과를 우리 버킷으로 · 실패 시 환불 | **끔** (HMAC로 대신) |

- 실패 순서를 맞춰 뒀다. 입력 검증 → fal 설정 확인 → 차감 → INSERT → 큐 등록이고,
  어디서 깨지든 앞에서 깎은 크레딧을 되돌린다
- 웹훅 멱등성은 `status in ('queued','processing')` 조건부 전이로 잡는다.
  행이 안 돌아오면 이미 처리된 것이라 환불을 건너뛴다
- `WEBHOOK_SECRET` 시크릿 등록됨
- **에러 코드는 `src/lib/errors.ts`에 있는 것만 쓴다.** 없는 코드를 던지면 "문제가 생겼어요"로 떨어진다
- `src/lib/supabase/functions.ts`의 `invokeFunction`을 거쳐 부른다.
  `functions.invoke`를 직접 쓰면 본문의 에러 코드가 화면에 닿지 않는다

**호출 계약** — 화면이 이 모양으로 부른다. 바꾸면 화면도 같이 고쳐야 한다.

| 함수 | body | 응답 |
|---|---|---|
| `draft-character` | `{ name, tone_id, traits, character_id? }` — `character_id`가 있으면 다시 뽑기 | `{ character_id }` |
| `refine-character` | `{ character_id, traits }` | `{ image_id }` |
| `build-character` | `{ character_id }` | `{ character_id }` |
| `create-look` | `{ character_id, name, hair_preset_id, top_preset_id, bottom_preset_id, scene_preset_id }` | `{ look_id }` |

후보 고르기·되돌리기는 함수가 아니라 SQL 함수 `select_character_image(character_id, image_id)`다.
돈도 GPU도 안 쓴다. — `docs/기획서.md` §6

**크레딧 값** — 화면(`CHARACTER_COST`)에 박혀 있다. 함수도 같은 값을 쓴다.

| 행위 | 비용 | 원장 사유 |
|---|---|---|
| 캐릭터 후보 뽑기 (다시 뽑기 포함) | 1 | `character_draft_charge` / `character_draft_refund` |
| 캐릭터 다듬기 1회 | 1 | `character_edit_charge` / `character_edit_refund` |
| 캐릭터 완성 (3방향) | 2 | `character_charge` / `character_refund` |
| 룩 만들기 | 1 | `look_charge` / `look_refund` |
| 영상 변환 | 1 | `job_charge` / `job_refund` |


## 없는 문서

| 파일 | 원래 내용 | 지금 |
|---|---|---|
| `docs/기획서.md` | 화면·데이터 모델·RLS | **2026-09-16에 새로 썼다.** 캐릭터 만들기의 원본은 이제 이 문서다 |
| `docs/claude-code-프롬프트.md` | S0~S10 붙여넣기용 | 없음. S0~S9는 이미 만들어져서 당장은 필요 없다 |

`CLAUDE.md`의 9규칙은 **복원했다.** 코드 주석 열 곳이 가리키던 자리에서 되살린 것이라
번호를 바꾸면 주석이 어긋난다.

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
| 캐릭터는 **생성물**. 사진 업로드는 없다 | 2026-09-16 개정 — `docs/기획서.md` §1. 톤을 고르고 뽑아서 다듬는다 |
| 캐릭터 각도는 **3방향** (정면·좌45·우45) | 확정하면 자동으로 뽑힌다. 사람이 찍지 않는다 |
| 룩은 **프리셋 슬롯만**, 자유 프롬프트 없음 | 설계서 결정. 흔들면 원가와 품질이 같이 무너진다. **캐릭터 커스터마이징도 칩이다** |
| **다크 모드 안 만듦** | 크림 배경이 디자인 시스템의 정체성이다 |
| MVP 스토리지는 **Supabase 하나** | R2 이관은 파일 1GB / egress 5GB가 신호 |

---

## 만들 순서

| # | 세션 | 끝나면 보이는 것 | 상태 |
|---|---|---|---|
| S0 | 프로젝트 초기화 | 빈 Next 앱이 뜬다 | 완료 |
| S1 | **디자인 토큰** | `/kitchen-sink`가 Lovable 톤으로 보인다 | 완료 |
| S2 | Supabase 스키마 + RLS | 마이그레이션이 돌고 타입이 생성된다 | 완료 — push·타입 생성까지 |
| S3 | 인증 (Google OAuth) | 구글 계정으로 로그인된다 | 완료 · 카카오만 남음 |
| S4 | 앱 셸 + 빈 대시보드 | 사이드바와 온보딩 화면 | 완료 |
| S5 | 캐릭터 | 목록·생성·상세 | 2026-09-16 스튜디오로 재작성 · **생성은 fal 모델 대기** |
| S6 | 룩 | 프리셋 4슬롯 선택과 채택 | 완료 · **생성은 fal 모델 대기** |
| S7 | 작업물 | 목록·상세·Realtime 상태 갱신 | 완료 |
| S8 | 크레딧 + Edge Function | 실제 차감이 일어난다 | 완료 — 함수 배포까지 |
| S9 | 마감 | 빈 상태·에러·모바일·접근성 | **로그인 후 화면 확인이 남음** |
| S10 | 배포 정리 | 운영 도메인에서 전부 돈다 | 배포·로그인 됨 · 커스텀 도메인은 나중 |

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
