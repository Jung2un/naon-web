# AI 대역 — 웹 관리 화면

내 대신 연기하는 AI 캐릭터 앱의 **웹 관리 화면**.
2026-09-17 · 솔로 개발

---

## TODO — 남은 것

2026-09-16에 계정 세팅(Supabase · Google OAuth · Vercel)과 Edge Function을 끝냈고,
2026-09-17에 **캐릭터 스튜디오**와 **이미지 모델 전환(fal → Gemini)**을 올렸다.
**끝난 내용은 이 문서 아래 "끝난 것"에 있다.** 여기는 아직 안 된 것만 둔다.

| 막는 것 | 누가 | 없으면 |
|---|---|---|
| **Gemini API 키 + 결제 연결** | 계정 작업 | **지금 유일하게 막는 것.** 캐릭터·룩 만들기가 503에서 멈춘다 |
| 카카오 — **비즈 앱 전환** (앱 아이콘 + 본인인증) | 계정 작업 · **나중에 하기로 함** | 로그인 화면에서 "곧 열려요"로 비활성 |

### A. Gemini 키 — **코드는 다 붙었다. 키만 넣으면 돈다**

캐릭터 후보·수정·3방향·룩은 전부 **Gemini 이미지 모델 하나**가 만든다.
얼굴을 유지한 채 고치는 게 이 모델의 대표 기능이고, 그게 3·4단계의 전부다.
어디에 뭐가 들어가는지는 `docs/기획서.md` §7.

**무료 티어는 없다.** 공식 가격표에서 이미지 모델 넷 다 Free tier가 "Not available"이다.
"하루 500장 무료"는 블로그발 오정보였으니 믿지 말 것. **결제가 붙은 키가 있어야 한 장이라도 나온다.**

- [ ] [aistudio.google.com](https://aistudio.google.com/app/apikey)에서 API 키 만들기
- [ ] 그 키가 속한 Google Cloud 프로젝트에 **결제 계정 연결** (안 하면 전부 실패한다)
- [ ] 시크릿 등록 — 싼 모델로 시작한다

```bash
npx supabase secrets set GEMINI_API_KEY=... GEMINI_IMAGE_MODEL=gemini-3.1-flash-lite-image
```

**품질을 올리는 손잡이는 `GEMINI_IMAGE_MODEL` 한 줄이다.** 시크릿만 바꾸고 재배포하면 끝이고,
코드는 하나도 안 바뀐다. 싼 걸로 돌려보고 아쉬우면 올린다.

| 모델 | 장당 | 캐릭터 하나(8장) |
|---|---|---|
| `gemini-3.1-flash-lite-image` | $0.0168 | 약 200원 |
| `gemini-3.1-flash-image` | $0.034 | 약 400원 |
| `gemini-3-pro-image` | $0.067 | 약 800원 |

#### 키를 넣고 **첫 한 판**에서 확인할 것

아직 아무도 실제 응답을 못 봤다. 아래는 한 번 돌려보면 전부 드러난다.
실패해도 **크레딧은 환불되고** 응답 본문이 함수 로그에 찍힌다.
로그는 대시보드에서 본다 — https://supabase.com/dashboard/project/alafyhejiaxukrkrmehh/functions/draft-character/logs
(CLI 2.117에는 `supabase functions logs`가 **없다.** `UnknownSubcommand`로 떨어진다)

- [ ] 응답 JSON 모양 — `_shared/gemini.ts`의 파서가 지금 두 모양을 훑는다. **실제 모양 하나로 줄일 것**
- [ ] `aspect_ratio: "3:4"` · `image_size: "1K"`를 그 모델이 받아주는지 (거절하면 UPSTREAM_ERROR)
- [ ] 좌45·우45가 화면에서 보는 방향과 맞는지. 뒤집혔으면 `_shared/prompt.ts` 문구로 잡는다
- [ ] 안전 필터에 걸리는 톤·속성 조합이 있는지 (`CONTENT_BLOCKED` 문구가 나오는지)
- [ ] 배경 작업이 후보 4장을 끝까지 채우는지 (Edge Function 실행 시간 안에 들어오는지)
- [ ] 다듬기 → 되돌리기 → 다시 뽑기 → 완성까지 한 바퀴

**fal은 영상에만 남는다.** 영상에서 사람을 캐릭터로 갈아끼우는 **Wan-Animate Replace**는
무료로도 Gemini로도 대체할 게 없다. 앱이 큐에 넣고 `fal-webhook`이 결과를 받는다.
웹에서 영상을 만들 일이 생기기 전에는 `FAL_KEY`가 없어도 캐릭터·룩은 다 돈다.

- [ ] fal.ai 계정 + 결제 수단 (영상 변환을 켤 때. 종량제라 첫 변환부터 돈이 나간다)

**Vercel에 넣지 말 것.** 시크릿이 없는 동안에는 함수가 **크레딧을 깎기 전에** 503으로 막는다
(`geminiConfig()`가 null이면 차감 앞에서 돌아선다). 키를 넣기 전에 버튼을 눌러도 크레딧이 안 날아간다.

**결과가 마음에 안 들 때 고칠 곳은 네 군데뿐이다.**

| 자리 | 무엇 |
|---|---|
| `character_options.prompt` (DB) | 톤·속성의 영어 조각. **배포 없이 고친다** |
| `presets.prompt` (DB) | 룩 프리셋의 영어 조각. **배포 없이 고친다**. 비어 있으면 한글 이름으로 되돌아간다 |
| `_shared/prompt.ts` | 조각을 잇는 규칙 — 수정 지시문, 각도 문구, 룩 문구 |
| `GEMINI_IMAGE_MODEL` (시크릿) | 모델 자체를 올린다 |

### B. 카카오 로그인 — **이메일 동의항목에서 멈춤. 나중에 하기로 함**

Google과 같은 자리에 붙인다. 버튼·로고·색은 이미 만들어져 있다 (`src/components/app/OAuthButton.tsx`).
2026-09-17에 Supabase와 카카오 콘솔 설정을 끝냈고, **비즈 앱 전환 하나만 남았다.**

**카카오 콘솔이 개편됐다.** 예전 "카카오 로그인 → 보안" 메뉴는 없어졌다(그 주소로 가면 "일반"으로 넘어간다).
리다이렉트 URI·클라이언트 시크릿·REST API 키가 **한 화면**에 모여 있다 —
**앱 → 플랫폼 키 → REST API 키(Default Rest API Key) 카드의 더보기 → 수정**
(`developers.kakao.com/console/app/1579601/config/platform-key/rest/5696220`)

- [x] Kakao Developers 앱 생성 → 카카오 로그인 사용 설정 ON (OpenID Connect도 켬 — 무방하다)
- [x] **카카오 로그인 리다이렉트 URI** 저장 — `https://alafyhejiaxukrkrmehh.supabase.co/auth/v1/callback`.
      바로 아래 "비즈니스 인증 리다이렉트 URI"와 헷갈리지 말 것
- [x] 클라이언트 시크릿 — 같은 화면에 이미 발급돼 있다. **"코드 재발급"은 누르지 말 것** (Supabase에 넣은 값이 무효가 된다)
- [x] Supabase Providers → Kakao 에 REST API 키 + 클라이언트 시크릿 → ON → Save.
      `authorize?provider=kakao`가 `400 provider is not enabled` → **`302 kauth.kakao.com`** 으로 바뀐 것 확인
- [x] 동의항목 — 닉네임 **필수 동의**, 프로필 사진 **선택 동의**
- [ ] **카카오계정(이메일) — "권한 없음"** ← 여기서 멈춤
- [ ] `src/lib/auth-providers.ts`에서 kakao의 `status`를 `"preparing"` → `"ready"` — **이메일이 켜진 뒤에**

**이메일을 안 켜면 로그인이 안 된다.** Supabase는 카카오에 `account_email profile_image profile_nickname`을
**항상 같이** 요청한다(authorize 리다이렉트 주소의 `scope`에서 확인). 이메일만 빼는 설정은 없다.
동의항목에 없는 걸 요청받으면 카카오가 `KOE205`로 막는다. 그래서 코드의 `status`를 아직 안 바꿨다 —
먼저 바꾸면 버튼을 누른 사람이 KOE205 화면을 본다.

"권한 없음"은 계정 문제가 아니라 **앱이 비즈 앱이 아니라서**다. 카카오 화면에 적힌 순서대로 하면 된다.

1. **앱 아이콘 등록** — 앱 → 일반 → 앱 기본 정보. 이게 없으면 전환이 막힌다
2. **개인 개발자 비즈 앱 전환** — 같은 화면 비즈니스 정보. 사업자번호 없이 **본인인증 + 카카오비즈니스 통합 서비스 약관 동의**
3. 동의항목에서 카카오계정(이메일)이 "설정"으로 바뀌면 **선택 동의**로 켜고 저장
4. 코드 `status` → `"ready"` 배포, 로그인 버튼으로 카카오 화면까지 확인

"추가 기능 신청 → 개인정보 동의항목" 심사는 **이메일 때문에 할 필요 없다.** 이메일은 비즈 앱 전환만으로 켜진다.

켜졌는지 확인 — `302`면 Supabase 쪽은 살아 있다.
```bash
curl -s -o /dev/null -w "%{http_code}\n" "https://alafyhejiaxukrkrmehh.supabase.co/auth/v1/authorize?provider=kakao"
```

### C. 썸네일 22장 — **끝났다. 사진으로 앱에 실었다**

- [x] 톤 6장 + 프리셋 16장을 `public/catalog/<종류>/<번호>.jpg`로 넣었다
      (`tone/1~6` · `hair|top|bottom|scene/1~4`). 버킷·서명·스토리지 호출이 없다
- [x] `src/lib/catalog.ts`가 DB의 `thumbnail_path`(`tone/1.jpg` …)를 키로 사진을 찾는다(`EXT = "jpg"`).
      카탈로그에 없는 경로만 예전처럼 `presets` 버킷에서 서명한다
- [x] 로컬에서 확인 — `/characters/new` 톤 6장, `/looks/new` 프리셋 16장 모두 200 `image/jpeg`

**출처 (2026-09-17).** 처음엔 SVG 그림이었고, 사용자가 준 레퍼런스 사진으로 바꿨다.
- 톤 1~4(실사·시네마틱·화보·일상 스냅) — 따로 받은 1254px 원본을 768px로
- 톤 5·6(애니·3D)과 프리셋 16장 — `전체 레퍼런스` 시트에서 잘라냄. 한 변 **154~244px로 작다.**
  타일이 최대 180px라 일반 화면은 괜찮지만 고해상도 화면에선 살짝 흐릴 수 있다. 원본을 따로 받으면 같은 이름으로 갈아끼운다
- 시트 칸이 세로로 길어서 **하의 4장은 자르지 않고** 칸 가장자리 린넨 띠로 양옆을 채웠다(허리·밑단이 잘려서).
  상의는 소매가 칸 끝에 닿아 채우면 번져서 가운데 정사각형으로 잘랐다

사진의 옷 색·머리 모양은 `presets.prompt`(영어 지시문)와 맞아야 한다 — 타일에서 본 것과 룩 결과가 어긋나지 않게.
지금 사진은 지시문과 맞는다(카멜 니트·하늘색 셔츠·세이지 후디·네이비 블레이저 등).
프롬프트로 다시 뽑을 때는 **`docs/카탈로그-이미지-프롬프트.md`**.
`proxy`의 매처가 이미지 확장자를 빼고 있어서 로그인 없이도 요청이 막히지 않는다.

### D. 마감 (S9~S10)

- [x] **로그인 후 화면들 확인 완료** — 실제 계정으로 대시보드·캐릭터·룩·룩 만들기·작업물·크레딧·설정·캐릭터 만들기.
      전부 빈 상태가 제대로 나온다. 가입 흐름도 통째로 검증됐다 —
      프로필 자동 생성, 보너스 15크레딧, 원장에 "가입 보너스 +15 / 잔량 15"
- [x] **375px 가로 스크롤 없음 — 전 화면 확인**. 375px iframe에서 실측했고
      모든 라우트가 `scrollWidth === clientWidth === 375`다.
      `/credits`·`/kitchen-sink`의 표는 `min-w-[520px]`로 545px까지 뻗지만
      자체 스크롤 컨테이너 안이라 페이지는 안 밀린다 — 의도된 패턴
- [ ] **스튜디오 화면은 아직 눈으로 못 봤다.** 후보 그리드·버전 스트립·3방향 진행이
      실제로 그려지는 걸 못 본 상태다 — **키가 있어야 첫 캐릭터가 생긴다 → A번 대기**
- [ ] 프리셋 그리드도 같은 이유로 못 봤다. `/looks/new`가 "쓸 수 있는 캐릭터가 없어요"에서 멈춘다
- [x] **크레딧 0인 계정으로 전 화면 확인** (2026-09-17). 깨지는 곳 없음, `/credits`는 0 전용 문구까지 나온다.
      스튜디오가 잔액을 몰라 다 고른 뒤에야 402를 받던 걸 고쳤다 — 이제 먼저 막고 충전 링크를 보여준다.
      점검은 `profiles.credits`만 0→15로 되돌렸고 원장은 안 건드렸다
- [ ] 생성을 일부러 실패시켜 에러 문구가 사람 말로 나오는지 확인 (A번 뒤에 된다)
- [ ] 커스텀 도메인 + Google 동의 화면 프로덕션 게시
- [ ] 결제 켜기 전에 **Vercel Pro 전환** (Hobby는 비상업용 전용)

### E. 캐릭터 스튜디오 — **올라갔다**

`docs/기획서.md`대로 캐릭터 만들기를 다시 지었다(톤 → 후보 4장 → 다듬기 → 3방향).
2026-09-17 기준 코드·스키마·함수가 전부 운영에 올라가 있고, 남은 건 A번 키뿐이다.

- [x] 마이그레이션 3개 push — `character_ledger_reasons` · `character_studio` · `character_options_seed`
- [x] 타입 재생성. `tsc` · `lint` · `build` 전부 통과
- [x] 함수 5개 배포 — `draft` · `refine` · `build-character` · `create-look` · `fal-webhook`
- [x] `create-character` 원격 함수 삭제 (옛 5각도 계약)
- [x] 이미지 공급자 전환 — fal 큐·웹훅 → Gemini 동기 호출 + 배경 작업.
      행 구조·`finish_character_batch`·환불·Realtime은 그대로다

> 시드에서 한 번 걸렸다. 속성 35행에 `thumbnail_path` 자리를 빠뜨려서 값이 6개라
> `VALUES lists must all be the same length`로 떨어졌다. 0005·0006은 이미 적용된 뒤였고
> 0007만 고쳐 다시 올렸다. **여러 열을 한 INSERT로 시드할 때 열 수를 세어볼 것.**

### 나중에

- [ ] 결제 (토스/Stripe) — S10 이후 별도
- [ ] 파일 1GB / egress 5GB 근접하면 Supabase Pro, 그 뒤 `videos`만 R2로
- [x] ~~룩 지시문이 프리셋 한글 이름을 그대로 싣는다~~ → `presets.prompt` 영어 조각 16개를 더했다(2026-09-17).
      조각은 썸네일에 그린 색·모양과 같게 적었다 — 타일에서 본 것과 결과가 어긋나지 않게. `create-look` 재배포 완료

---

## 끝난 것 — 2026-09-16 · 09-17

다시 안 해도 되는 것들. 값이 필요하면 여기서 찾는다.

**Supabase** — 프로젝트 `ai-web` · ref `alafyhejiaxukrkrmehh` · 리전 `ap-northeast-2`(서울) · 조직 `Jung2un`

- CLI가 레포에 devDependency로 들어 있다. 전역 설치 없이 `npx supabase …`. link는 걸려 있다
- 마이그레이션 7개 적용 — `init` · `ledger_reasons` · `presets_seed` · `credit_functions` ·
  `character_ledger_reasons` · `character_studio` · `character_options_seed`
- 톤·속성 35종 시드 완료. 프리셋과 같은 이유로 id를 고정했다
- `src/types/database.ts`는 이제 진짜 생성물이다 (`gen types typescript --linked`). 손으로 고치지 않는다
- 프리셋 16종 시드 완료. id 고정이라 환경 사이에서 참조가 유지된다
- `charge_credits` / `refund_credits` — 확인과 차감이 SQL 한 문장. 잔액 부족은 예외가 아니라 `null`.
  실행 권한은 `service_role`에만
- API 키가 필요하면 `npx supabase projects api-keys --project-ref alafyhejiaxukrkrmehh`

**이미지 생성** — 2026-09-17에 fal에서 Gemini로 옮겼다

- 캐릭터(후보·수정·3방향)와 룩 이미지는 전부 Gemini 이미지 모델 하나가 만든다
- **큐도 웹훅도 없다.** 함수는 행만 만들고 `EdgeRuntime.waitUntil`로 배경에서 채운다 —
  `_shared/gemini.ts`(호출·파싱) · `_shared/batch.ts`(배치 한 판)
- `_shared/fal.ts`는 웹훅 확인과 결과 URL 꺼내기만 남았다. 영상 전용이다
- 필요한 시크릿은 `GEMINI_API_KEY` · `GEMINI_IMAGE_MODEL` 둘 (**아직 안 넣었다 — TODO A번**)

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

**Edge Function** — 다섯 다 배포됨

| 함수 | 하는 일 | JWT |
|---|---|---|
| `draft-character` | 1크레딧 · 톤·속성 검증 · `characters` + 후보 4행 INSERT · 배경에서 4장 | 검증함 |
| `refine-character` | 1크레딧 · **바뀐 속성만** 지시문으로 · 수정본 1행 · 배경에서 1장 | 검증함 |
| `build-character` | 2크레딧 · 3방향 3행 · 배경에서 3장 | 검증함 |
| `create-look` | 1크레딧 · 프리셋 슬롯 검증 · `looks` INSERT · 배경에서 1장 | 검증함 |
| `fal-webhook` | **영상 전용.** 조건부 상태 전이 · 결과를 우리 버킷으로 · 실패 시 환불 | **끔** (HMAC로 대신) |

- 실패 순서를 맞춰 뒀다. 입력 검증 → 키 확인 → 차감 → INSERT → 배경 작업이고,
  어디서 깨지든 앞에서 깎은 크레딧을 되돌린다. 그림이 실패하면 배치를 닫으며 환불한다
- 이중 환불은 **조건부 상태 전이** 하나로 막는다. 캐릭터는 `finish_character_batch`가
  캐릭터 행을 `status='processing'`일 때만 옮기고, 룩·영상은 행 자체를 조건부로 잡는다.
  행이 안 돌아오면 이미 처리된 것이라 환불을 건너뛴다
- `WEBHOOK_SECRET` 시크릿 등록됨 (영상 웹훅 전용)
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
| S5 | 캐릭터 | 목록·생성·상세 | 2026-09-17 스튜디오로 재작성 · **생성은 Gemini 키 대기** |
| S6 | 룩 | 프리셋 4슬롯 선택과 채택 | 완료 · **생성은 Gemini 키 대기** |
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
| 첫 캐릭터부터 | Gemini 이미지 종량제 — 캐릭터 하나 200~800원 (`docs/기획서.md` §7) |
| 첫 영상 변환부터 | fal.ai 종량제 (설계서 원가표) |

합쳐 **월 $45**. ₩24,900 구독 기준 **2.7명**이면 인프라가 자립한다.
인프라는 지금도 $0지만 **이미지는 첫 장부터 돈이 나간다.** 자세한 건 `docs/배포.md` §7.

---

## 자주 틀리는 세 곳

1. **Supabase Redirect URLs에 프리뷰 와일드카드가 빠짐** → Vercel 프리뷰 URL은 배포마다 바뀐다. `https://ai-daeyeok-*.vercel.app/**`를 넣어야 한다. 안 넣으면 프리뷰에서 로그인이 전부 막히고 원인을 코드에서 찾게 된다.
2. **Google에 우리 도메인을 등록함** → 거기 들어가는 건 `https://<ref>.supabase.co/auth/v1/callback`이다. 우리 도메인은 Supabase 쪽 허용목록에 넣는다.
3. **함수 리전을 기본값으로 둠** → `iad1`(워싱턴)이라 서울 Supabase까지 태평양을 왕복한다. `icn1`로 고정할 것.

---

## 다음 단계 (이 문서 밖)

설계서의 **$1 검증**이 아직 안 끝났다면 그게 먼저다 — 스튜디오로 캐릭터를 하나 만들고, 폰으로 10초 찍고, fal.ai 콘솔에서 Wan-Animate Replace에 넣어보기. 여기에 joyosapp을 설치해 같은 소스로 돌려 나란히 비교하면 품질 기준선이 생긴다.

결과가 인스타에 올릴 수준이면 위 S0부터 시작하고, 아니면 웹을 짓기 전에 방향부터 다시 본다.
