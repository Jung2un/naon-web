# AI 대역 — 웹 관리 화면

내 대신 연기하는 AI 캐릭터 앱의 **웹 관리 화면**.
2026-09-16 · 솔로 개발

---

## TODO — 다음에 할 것

웹 코드(S0~S9)는 만들어져 있고 `npm run build`가 통과한다.
아래는 **계정이 있어야 되는 일**이라 아직 못 한 것들. 위에서부터 순서대로 하면 된다.

### 0. 계정 전환 — 이게 먼저다

- [ ] Claude Desktop / Claude Code를 **개인 계정**으로 전환
  - 지금 `lje@archseoul.com`(회사 계정)으로 로그인돼 있다
  - 여기서 만든 Supabase·Vercel 리소스는 **회사 계정 소유가 된다.** 나중에 옮기기 어렵다
  - 아래 1~4를 회사 계정으로 진행하지 말 것

### 1. Supabase

- [ ] 프로젝트 생성 — 리전 **Northeast Asia (Seoul) / `ap-northeast-2`** (나중에 못 바꾼다)
- [ ] Project Settings → API에서 `Project URL` · `anon key` · 프로젝트 `ref` 메모
- [ ] Vercel 환경변수에 `NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_ANON_KEY` 등록
      (스코프 Production / Preview / Development **전부** 체크)
- [ ] `supabase db push` — `supabase/migrations/20260916000001_init.sql`
- [ ] `supabase gen types typescript --project-id <ref> > src/types/database.ts`
      로 덮어쓰기 (지금은 마이그레이션을 손으로 옮겨 적어 둔 상태다)
- [ ] `presets` 테이블 시드 + `presets` 버킷에 썸네일 업로드
      (머리·상의·하의·장소 각 4종 — 지금은 이미지 없이 이름만 나온다)

### 2. OAuth

- [ ] **Google Cloud** OAuth 클라이언트 생성
  - 승인된 리디렉션 URI는 `https://<ref>.supabase.co/auth/v1/callback` **하나만**
  - 우리 도메인을 여기 넣는 게 아니다. 자주 틀리는 지점
  - client ID/secret → Supabase → Authentication → Providers → Google
- [ ] **Kakao** 개발자 앱 생성 → Supabase → Providers → Kakao 활성화
  - 버튼·로고·색은 이미 만들어져 있다 (`src/components/app/OAuthButton.tsx`)
  - 켠 뒤 `src/lib/auth-providers.ts`에서 kakao의 `status`를
    `"preparing"` → `"ready"` **한 단어만** 바꾸면 동작한다
- [ ] Supabase → Authentication → URL Configuration
  - Site URL: `https://ai-daeyeok.vercel.app`
  - Redirect URLs: `https://ai-daeyeok.vercel.app/**`
  - 로컬을 안 쓰기로 해서 `localhost` 줄은 넣지 않는다

### 3. Vercel

- [ ] GitHub 레포 생성 + Vercel에 Import
- [ ] **함수 리전을 `icn1`(서울)로** — `vercel.json`에 이미 박아 뒀지만 대시보드에서 확인
- [ ] 배포 후 실제 URL 확인
- [ ] **실제 URL이 `ai-daeyeok.vercel.app`이 아니면** `src/lib/site-url.ts`의
      `PRODUCTION_URL` 한 줄을 고친다 (URL이 코드에 있는 자리는 여기 하나뿐이다)

### 4. Edge Function — 아직 하나도 없다

웹은 읽기만 한다. 쓰기는 전부 Edge Function 몫인데 아직 안 만들었다.
지금 화면에서 "만들기" 버튼을 누르면 함수가 없어서 실패한다.

- [ ] `create-character` — 크레딧 차감 + `characters` INSERT + fal.ai 호출
- [ ] `create-look` — 크레딧 차감 + `looks` INSERT
- [ ] 변환 완료 웹훅 — `jobs` 상태 갱신, 실패 시 크레딧 환불
- [ ] `supabase secrets set FAL_KEY=...` (Vercel에 넣지 말 것)

### 5. 마감 (S9~S10)

- [ ] 375px에서 가로 스크롤 없는지 실제 기기/브라우저로 확인 — **아직 눈으로 못 봄**
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
| S2 | Supabase 스키마 + RLS | 마이그레이션이 돌고 타입이 생성된다 | 마이그레이션 작성 완료 · **push는 아직** |
| S3 | 인증 (Google OAuth) | 구글 계정으로 로그인된다 | 코드 완료 · **공급자 설정 아직** |
| S4 | 앱 셸 + 빈 대시보드 | 사이드바와 온보딩 화면 | 완료 |
| S5 | 캐릭터 | 목록·생성·상세 | 화면 완료 · **생성은 Edge Function 필요** |
| S6 | 룩 | 프리셋 4슬롯 선택과 채택 | 화면 완료 · **생성은 Edge Function 필요** |
| S7 | 작업물 | 목록·상세·Realtime 상태 갱신 | 완료 |
| S8 | 크레딧 + Edge Function | 실제 차감이 일어난다 | 화면·원장 완료 · **함수 아직** |
| S9 | 마감 | 빈 상태·에러·모바일·접근성 | 빈 상태·에러 완료 · **375px 미확인** |
| S10 | 배포 정리 | 운영 도메인에서 전부 돈다 | 아직 |

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
