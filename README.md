# TODO — 유료 운영 전 준비 (최우선)

> 개인 프로젝트라도 영상 생성권·크레딧·구독을 계속 판매하면 원칙적으로 사업자등록 대상이다. 무통장입금도 동일하다. 상표등록은 수익화의 필수 조건이 아니다.

- [ ] 유료 운영 전 개인사업자등록 준비 및 신청 시점 확인 (원칙적으로 사업 개시일부터 20일 이내).
- [ ] 통신판매업 신고 대상·면제 여부 확인 후 필요한 신고 진행.
- [ ] 결제 방식별 매출 기록·세금 신고·현금영수증 등 증빙 의무 확인.
- [ ] 이용약관·개인정보 처리방침·가격·환불 기준과 필수 사업자 정보 표시 점검.
- [ ] **나온 / NAON** 선행상표의 지정상품·유사 여부 검토. 상표 출원은 브랜드 보호를 위한 별도 과제로 진행.

근거: [국세청 사업자등록 안내](https://j.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7776&mi=2443) · [전자상거래법 제12조](https://www.law.go.kr/lsLinkCommonInfo.do?lsJoLnkSeq=1029561435) · [상표 제도 안내](https://www.moip.go.kr/ko/kpoContentView.do?menuCd=SCD0200154)

## 나온 · NAON 브랜딩 (2026-09-30)

**내 캐릭터로 만드는 짧은 영상.** 얼굴상·헤어·분위기를 직접 고르고 눈·코·눈썹까지 다듬은 캐릭터로, 직접 촬영한 영상 속 내 모습을 바꾸는 AI 숏폼 제작 서비스.

- 로고 워드마크·탭 제목·공유 메타데이터·로그인·로그인 후 홈 소개를 나온으로 통일.
- 기존 크림·차콜 컬러와 Shift 심볼 유지. 실시간 버추얼 방송은 현재 제공 기능으로 홍보하지 않음.
- 운영 주소는 https://meetnaon.vercel.app. Vercel 프로젝트 `meetnaon`, 저장소 `naon-web`, Supabase 표시 이름 `Naon`으로 통일.
- [x] 브랜드 Gmail `meetnaon@gmail.com` 및 인스타그램 [@meet_naon](https://www.instagram.com/meet_naon/) 계정 생성.
- [x] 기존 프로젝트 앱 아이콘을 인스타그램 프로필 사진으로 적용, 서비스 소개 저장.
- [x] 첫 피드 3개 개편 완료: 흰 배경 브랜드 소개 → 여성·남성·여성 캐릭터 3장 캐러셀 → 사용법 가이드 순서로 발행 (프로필 왼쪽부터 3·2·1). 로고 외 제목은 Pretendard. 본문 해시태그·대체 텍스트·사진 AI 레이블 적용. 단발 여성 사진은 승인 원본의 얼굴·머리를 그대로 보존해 끈나시 부분 합성.
- [ ] 인스타그램 모바일 앱에서 프로필 외부 링크 추가 (웹 편집은 비활성화).
- [x] `meetnaon.vercel.app` 확보, Supabase Site URL·Redirect URLs·함수 요청 허용 도메인 연결.
- [x] 나온 브랜딩 웹 운영 배포, 프로덕션 빌드·모바일/데스크톱 배치·운영 로그인 페이지 확인 (실제 OAuth 로그인은 별도 사용자 확인).

---

# 캐릭터 프롬프트 개편 (2026-09-21)

캐릭터 후보 요청(`draftPrompt`)을 키워드 나열에서 **구조화된 JSON 요청**으로 바꿨습니다. `task · scene · subject · camera_technical · avoid · output`으로 나누고, 사람(성별·나이·얼굴·체형·머리)은 `identity_fixed`에, 장면·옷·표정은 `scene`·`styling`에 담아 고정되는 것과 바뀌는 것을 분리했습니다. 실사 어휘(natural skin texture · muted neutral palette · shallow depth of field · Korean editorial/lifestyle photography · candid · understated)는 사진 톤 4개에만 붙고 애니·3D에는 붙지 않습니다. `beautiful · flawless · perfect` 같은 형용사는 쓰지 않습니다 — 그 말이 AI 티 나는 얼굴을 만듭니다. **성별별 연출**을 따로 썼습니다(여성: 은은한 메이크업·뷰티 필터 금지 / 남성: 그루밍·모공·턱 음영, 여성화 보정 금지 / 중성: 어느 쪽으로도 뚜렷히 읽히지 않는 균형). DB 톤 문장은 그대로라 마이그레이션은 없고 `draft-character` 함수만 다시 올리면 됩니다. 구조·성별별 표·검증은 [캐릭터 생성 프롬프트 문서](docs/캐릭터-생성-프롬프트.md)에 있습니다. 실제 품질 비교는 아직 안 했습니다.

# 재시도·진행 안내 (2026-09-20)

실패한 영상·캐릭터에 다시 시도하기를 추가했습니다. 생성/변환 중 단계·경과 시간·예상 대기 시간과 이미지 저장 완료 장수를 표시합니다. 자동 유료 재시도는 하지 않습니다. 룩/배경 숨김은 main에 포함되어 있으나 이전 Vercel 배포가 차단된 상태라 운영 반영에는 Vercel 인증·재배포 확인이 필요합니다. [상세 동작과 검증](docs/생성-재시도-진행안내.md)을 참고하세요.

# 룩·배경 임시 비활성화 (2026-09-20)

룩/배경 관련 화면을 `src/features/looks/`로 이동해 한곳에 보관했습니다. `config.ts`에서 활성화 선언을 주석으로 남기고 `LOOKS_ENABLED=false`로 비활성화했습니다. 메뉴·홈 안내·캐릭터 상세·영상 스타일 선택에서 숨기며, `/looks`와 `/looks/new` 직접 접근은 캐릭터 목록으로 이동합니다. 영상 변환은 캐릭터 기본 이미지를 사용합니다.

기존 DB·이미지·서버 API는 유지합니다. 복원할 때는 공통 설정을 `true`로 바꾸고 웹을 재배포하면 됩니다. 이동 목록과 범위는 [보관 안내](src/features/looks/README.md)를 참고하세요. 아래 과거 기록의 룩 화면 설명보다 이 상태를 우선합니다.

<details>
<summary><strong>AI 연동 업데이트 (2026-09-18) — 완료, 최신은 docs/AI-연동.md</strong></summary>

# AI 연동 업데이트 (2026-09-18)

이미지 기본 모델은 Gemini 3.1 Flash Image, 영상은 fal Wan Animate Replace입니다. `/jobs/new` 영상 업로드·변환과 키 설정 확인, 원자적 차감·환불을 추가했습니다. Google·fal 계정을 준비하고 Supabase에 GEMINI_API_KEY·FAL_KEY를 등록했습니다. 웹과 Edge Function 7개는 운영 배포 완료했으며, 결제 연결 확인과 실제 유료 생성 검증은 남아 있습니다. 최신 설정·배포·운영 절차는 [AI 연동 문서](docs/AI-연동.md)를 따릅니다. 아래 과거 작업 기록의 모델·준비 상태보다 이 문서를 우선합니다.

</details>

# 웹 관리 화면

내 대신 연기하는 AI 캐릭터 앱의 **웹 관리 화면**.
2026-09-17 · 솔로 개발

---

## TODO — 현재 상태 (2026-09-21)

<details>
<summary><strong>완료한 작업 (2026-09-18까지)</strong></summary>

### 완료한 작업

- [x] 베이지·연회색 디자인 토큰 유지, 공통 버튼·입력·카드·상태 표시와 `/kitchen-sink` 정리
- [x] 홈 제작 안내, 캐릭터 검색·필터·초기화, 내비게이션과 모바일 터치 영역 개선
- [x] 머릿결 질감 기반 머리색 7종 선택, 코토리 베이지·핑크 브라운 추가, 머리색 다음에 나이대 배치
- [x] 이미지 생성·수정·3방향·룩에 Gemini 3.1 Flash Image 연동 (`gemini-3.1-flash-image` 기본값)
- [x] `/jobs/new` 영상 업로드·변환 화면 및 fal Wan Animate Replace 큐 연동 (720p)
- [x] 영상 MP4 50MB·3~10초 검증, 소유권 확인, 원자적 차감·완료·1회 환불, 같은 작업 중복 요청 방지
- [x] 웹훅 HMAC 확인, 결과 URL 제한, private 스토리지 저장, 키 설정 상태 조회 추가
- [x] 머리색·영상 파이프라인 마이그레이션 2건 원격 적용, 실제 DB에서 타입 재생성
- [x] Google AI Studio·fal 계정 준비, Supabase Edge Function Secrets에 `GEMINI_API_KEY`·`FAL_KEY` 저장 확인
- [x] 기존 `WEBHOOK_SECRET` 유지. 실제 키는 저장소와 Vercel에 넣지 않음
- [x] Edge Function 7개와 [운영 웹](https://meetnaon.vercel.app) 배포 완료
- [x] mock 테스트 7개, Edge Function 7개 타입 검사, ESLint, Next.js 프로덕션 빌드 통과
- [x] 운영 `/kitchen-sink` HTTP 200 및 비로그인 `ai-status` HTTP 401 확인

</details>

### A. 남은 AI 운영 확인

키 저장과 실제 모델 사용 가능 여부는 별개다. 유료 생성·변환은 아직 실행하지 않았다.

- [ ] Google 키가 속한 프로젝트의 결제 연결·모델 사용 권한·할당량 확인
- [ ] fal 결제 수단 등록 및 크레딧 충전 확인 (마지막 확인 시 잔액 $0)
- [ ] 새 JSON 프롬프트로 여성·남성·중성 후보를 같은 옵션으로 뽑아 이전 결과와 품질 비교. 어색한 성별은 `GENDER_PRESENTATION` 문구를 고친다
- [ ] 캐릭터 후보 4장 → 다듬기 → 되돌리기 → 다시 뽑기 → 3방향 완성 → 룩 생성 실사용 검증
- [ ] 실제 응답 파싱, 3:4·1K 옵션, 얼굴 일관성·좌우 각도·안전 필터와 실행 시간 확인
- [ ] 완성한 캐릭터로 3~10초 MP4 변환 → 웹훅 → 결과 재생까지 검증
- [ ] 실패·중복 요청·웹훅 재전송 시 크레딧이 한 번만 차감·환불되는지 실제 환경에서 확인
- [ ] 로그인 후 데스크톱·모바일의 생성부터 결과까지 전체 흐름 확인

영상 큐 접수 여부가 불확실하면 유료 요청을 자동 재전송하지 않는다. 작업은 웹훅 또는 운영 확인을 기다린다.
콜백 저장 실패는 재전송을 위해 500을 반환한다. 공급자 응답 본문이나 키를 로그에 기록하지 않는다.
`GEMINI_IMAGE_MODEL`은 선택 설정이며, 미등록 시 `gemini-3.1-flash-image`를 사용한다.
자세한 설정·복구 절차는 [AI 연동 문서](docs/AI-연동.md)를 따른다.

<details>
<summary><strong>B. 카카오 로그인 — 이메일 동의항목에서 멈춤, 나중에</strong></summary>

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

</details>

<details>
<summary><strong>C. 썸네일 22장 — 끝났다</strong></summary>

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

**톤 사진은 성별마다 따로 둔다 (2026-09-17).** 캐릭터 만들기에서 성별을 누르면 톤 6칸이 그 성별 사진으로 바뀐다.
- [x] 여성 — `tone/1~6.jpg` (기본)
- [x] **남성** — `tone/male/1~6.jpg` (레퍼런스 01~06), 켜짐
- [x] **중성적** — `tone/neutral/1~6.jpg` (레퍼런스 07~12), 켜짐
- [x] 여성 애니·3D를 시트에서 자른 작은 이미지 → 1254px 원본(레퍼런스 13·14)으로 교체

켜기 전에는 여성 사진이 그대로 나와서 안 깨진다. 남성 폴더를 임시로 채워 켜 보고,
남성 → `tone/male/*`, 안 켠 중성적 → 여성 사진으로 돌아가는 것까지 로컬에서 확인했다(테스트 파일은 지움).
프롬프트는 위 문서의 "톤 — 성별별 사진".

**성별별 머리 · 룩 코디 (2026-09-17, 마이그레이션 `0009`·`0010`).** 레퍼런스 시트 15~20번을 넣었다.
- [x] **캐릭터 만들기 머리** — 성별마다 사진 8장(`trait/hair/{female,male,neutral}/1~8.jpg`).
      `character_options.gender_id`로 성별에 매었고, 화면은 고른 성별 머리만 보여준다.
      성별을 바꾸면 안 맞는 머리 선택은 풀린다(`setGender`). 함수도 다른 성별 머리를 거절한다
      (`draft-character`·`refine-character`의 `matchesGender`). 옛 글자 칩 6개는 껐다(캐릭터 0건일 때라 참조 없음)
- [x] **룩 = 코디 한 벌 (+ 장소는 선택)** — 머리는 캐릭터를 만들 때 정했으니 룩에서 안 고르고, 상의·하의 따로 고르기는 없앴다.
      **장소는 기본으로 바꾸지 않는다** — 인물만 바꾸고 배경은 찍은 그대로 둔다. 자기 장소가 드러나는 게 싫은
      사용자만 장소를 고른다. 안 고르면 지시문에 "배경 그대로"가 들어간다(`0013`, scene_preset_id NULL 허용).
      코디 사진은 얼굴이 안 보이게 턱 아래부터 잘랐다 — 옷만 보여야 고르기 쉽다
      코디는 데일리 12 · 무대 12 · 아우터 6(`outfit/*`, 3:4 사진). `presets.slot='outfit'` + `category`,
      `looks.outfit_preset_id`. 룩의 hair·top·bottom NOT NULL을 풀었고(`0010`·`0011`),
      `looks_outfit_or_separates`가 옷을 강제한다. 지시문은 "머리는 그대로, 이 코디를 입혀"다.
      옛 머리·상의·하의 프리셋 행과 사진은 남아 있지만 화면에서 쓰지 않는다
- 머리 24개·코디 30벌의 이름과 영어 지시문은 사진을 보고 붙였다. 결과가 흔들리면 DB의 `prompt` 열만 고친다
- 시트는 칸이 3:4가 아니라서 — 데일리는 양옆을 배경 띠로 채웠고, 무대·아우터는 양옆을 잘랐다(무대 3번 리본 끝이 살짝 잘림)
`proxy`의 매처가 이미지 확장자를 빼고 있어서 로그인 없이도 요청이 막히지 않는다.

</details>

<details>
<summary><strong>로고 · 파비콘 — 들어갔다 (2026-09-17)</strong></summary>

### 로고 · 파비콘 — **들어갔다 (2026-09-17)**

- [x] 파비콘(`src/app/favicon.ico` · `icon.png` · `apple-icon.png`) — Next 기본 아이콘을 교체. `<link>` 3개가 자동으로 붙는 것 확인.
      셋 다 크림(`#f7f4ed`) 배경 + 차콜 심볼이다 — 처음 넣은 코발트 파비콘은 크림으로 바꿨다
- [x] 화면 로고 — `BrandMark`(차콜 심볼)를 사이드바 · 모바일 상단 · 로그인에. 서비스 이름은 아직 없어서 글자는 안 붙인다
- [x] 임시 서비스 이름 문구를 전부 뺐다 — 탭 제목은 화면 이름만, 로그인 제목은 "로그인하고 시작해요",
      캐릭터 설명은 "내 캐릭터". 도메인·레포 이름도 나온 브랜딩에 맞춰 변경했다
- [x] 캐릭터 만들기에서 비워도 되는 갈래는 "선택" 뱃지로 표시한다(`TraitRow`의 `OptionalBadge`)
- [x] 톤 노출 순서 — 실사 · 일상 스냅 · 화보 · 시네마틱 · 3D 캐릭터 · 애니 (여성·남성·중성 공통, `0012`)
- 사용 규칙(여백 · 늘이기·돌리기 금지 · 파비콘도 크림 배경)은 `docs/로고-가이드.md`

</details>

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
- [x] **캐릭터 만들기 순서 (2026-09-17)** — 1단계: 성별 → 톤 → 머리(톤처럼 사진 타일) → 나이대 → 머리색 → 체형 → 분위기.
      성별은 여성으로 선택된 채 시작한다. **이름은 1단계에서 받지 않는다** — 3단계 다듬기 화면의
      "캐릭터 완성하기" 바로 위에서 적고, `build-character`가 받아 저장한다. 그 전까지 DB에는 임시 이름
      `새 캐릭터`(`PLACEHOLDER_CHARACTER_NAME`)가 들어간다. 이름이 없으면 완성 버튼이 막히고 함수도 `NAME_REQUIRED`로 거절한다.
      ⚠ 3단계 이름 칸은 캐릭터가 다듬기까지 가야 보여서(Gemini 키 필요) 아직 눈으로 못 봤다
- [x] **크레딧 0인 계정으로 전 화면 확인** (2026-09-17). 깨지는 곳 없음, `/credits`는 0 전용 문구까지 나온다.
      스튜디오가 잔액을 몰라 다 고른 뒤에야 402를 받던 걸 고쳤다 — 이제 먼저 막고 충전 링크를 보여준다.
      점검은 `profiles.credits`만 0→15로 되돌렸고 원장은 안 건드렸다
- [ ] 생성을 일부러 실패시켜 에러 문구가 사람 말로 나오는지 확인 (A번 뒤에 된다)
- [ ] 커스텀 도메인 + Google 동의 화면 프로덕션 게시
- [ ] 결제 켜기 전에 **Vercel Pro 전환** (Hobby는 비상업용 전용)

<details>
<summary><strong>E. 캐릭터 스튜디오 — 올라갔다</strong></summary>

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

</details>

### 나중에

- [ ] 결제 (토스/Stripe) — S10 이후 별도
- [ ] 파일 1GB / egress 5GB 근접하면 Supabase Pro, 그 뒤 `videos`만 R2로
- [x] ~~룩 지시문이 프리셋 한글 이름을 그대로 싣는다~~ → `presets.prompt` 영어 조각 16개를 더했다(2026-09-17).
      조각은 썸네일에 그린 색·모양과 같게 적었다 — 타일에서 본 것과 결과가 어긋나지 않게. `create-look` 재배포 완료

---

<details>
<summary><strong>이전 작업 기록 — 2026-09-16 · 09-17</strong></summary>

## 이전 작업 기록 — 2026-09-16 · 09-17

당시 완료한 작업 기록이다. 현재 준비 상태는 위 TODO와 AI 연동 문서를 우선한다.

**Supabase** — 프로젝트 `Naon` · ref `alafyhejiaxukrkrmehh` · 리전 `ap-northeast-2`(서울) · 조직 `Jung2un`

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
- `GEMINI_API_KEY` 등록 완료(2026-09-18). `GEMINI_IMAGE_MODEL`은 선택 설정이며 기본값은 `gemini-3.1-flash-image`.

**인증** — Google만 켜져 있다 (`/auth/v1/settings`에서 external.google만 true, email은 false)

- Google 승인된 리디렉션 URI는 `https://alafyhejiaxukrkrmehh.supabase.co/auth/v1/callback` 하나
- 동의 화면은 아직 "테스트" 상태다. 등록된 테스트 사용자만 로그인된다
- **Site URL·Redirect URLs는 `supabase/config.toml`이 원본이다.** 대시보드에서 손으로 고치지 말 것 —
  다음 `npx supabase config push`가 이 파일 값으로 되돌린다.
  무관한 값들은 원격 현재 값에 맞춰 놨으니, 새 값을 바꿀 때는 `config diff`로 먼저 볼 것

**Vercel** — 프로젝트 `meetnaon` (`jung2uns-projects`) · https://meetnaon.vercel.app

- GitHub 레포가 연결돼 있다. `main`에 push하면 배포된다
- `NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_ANON_KEY`가 Production/Preview/Development 전부에
- 함수 리전 `icn1` (`vercel.json`)
- 운영 URL은 `meetnaon.vercel.app`이며 `site-url.ts`에서 관리한다

**Edge Function** — 7개 운영 배포 완료(2026-09-18)

| 함수 | 하는 일 | JWT |
|---|---|---|
| `draft-character` | 1크레딧 · 톤·속성 검증 · `characters` + 후보 4행 INSERT · 배경에서 4장 | 검증함 |
| `refine-character` | 1크레딧 · **바뀐 속성만** 지시문으로 · 수정본 1행 · 배경에서 1장 | 검증함 |
| `build-character` | 2크레딧 · 3방향 3행 · 배경에서 3장 | 검증함 |
| `create-look` | 1크레딧 · 프리셋 슬롯 검증 · `looks` INSERT · 배경에서 1장 | 검증함 |
| `create-video` | 영상 검증 · 원자적 차감 · fal 큐 제출 | 검증함 |
| `ai-status` | 로그인 사용자에게 키 설정 여부만 반환 | 검증함 |
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

</details>

<details>
<summary><strong>없는 문서 · CLAUDE.md 복원 메모</strong></summary>

## 없는 문서

| 파일 | 원래 내용 | 지금 |
|---|---|---|
| `docs/기획서.md` | 화면·데이터 모델·RLS | **2026-09-16에 새로 썼다.** 캐릭터 만들기의 원본은 이제 이 문서다 |
| `docs/claude-code-프롬프트.md` | S0~S10 붙여넣기용 | 없음. S0~S9는 이미 만들어져서 당장은 필요 없다 |

`CLAUDE.md`의 9규칙은 **복원했다.** 코드 주석 열 곳이 가리키던 자리에서 되살린 것이라
번호를 바꾸면 주석이 어긋난다.

</details>

---

<details>
<summary><strong>파일 구조</strong></summary>

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

</details>

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

<details>
<summary><strong>만들 순서 S0~S10 — 대부분 완료</strong></summary>

## 만들 순서

| # | 세션 | 끝나면 보이는 것 | 상태 |
|---|---|---|---|
| S0 | 프로젝트 초기화 | 빈 Next 앱이 뜬다 | 완료 |
| S1 | **디자인 토큰** | `/kitchen-sink`가 Lovable 톤으로 보인다 | 완료 |
| S2 | Supabase 스키마 + RLS | 마이그레이션이 돌고 타입이 생성된다 | 완료 — push·타입 생성까지 |
| S3 | 인증 (Google OAuth) | 구글 계정으로 로그인된다 | 완료 · 카카오만 남음 |
| S4 | 앱 셸 + 빈 대시보드 | 사이드바와 온보딩 화면 | 완료 |
| S5 | 캐릭터 | 목록·생성·상세 | 2026-09-17 스튜디오로 재작성 · **키 등록 완료 · 실사용 검증 대기** |
| S6 | 룩 | 프리셋 4슬롯 선택과 채택 | 완료 · **키 등록 완료 · 실사용 검증 대기** |
| S7 | 작업물 | 목록·상세·Realtime 상태 갱신 | 완료 |
| S8 | 크레딧 + Edge Function | 실제 차감이 일어난다 | 완료 — 함수 배포까지 |
| S9 | 마감 | 빈 상태·에러·모바일·접근성 | **로그인 후 화면 확인이 남음** |
| S10 | 배포 정리 | 운영 도메인에서 전부 돈다 | 배포·로그인 됨 · 커스텀 도메인은 나중 |

**S1이 끝나기 전에는 화면을 만들지 않는다.** 토큰이 자리잡기 전에 화면이 생기면 나중에 전부 다시 칠하게 된다.

남은 건 위 TODO에 있다. 결제(토스/Stripe)는 S10 이후 별도.

</details>

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

1. **Supabase Redirect URLs에 프리뷰 와일드카드가 빠짐** → Vercel 프리뷰 URL은 배포마다 바뀐다. `https://meetnaon-*.vercel.app/**`를 넣어야 한다. 안 넣으면 프리뷰에서 로그인이 전부 막히고 원인을 코드에서 찾게 된다.
2. **Google에 우리 도메인을 등록함** → 거기 들어가는 건 `https://<ref>.supabase.co/auth/v1/callback`이다. 우리 도메인은 Supabase 쪽 허용목록에 넣는다.
3. **함수 리전을 기본값으로 둠** → `iad1`(워싱턴)이라 서울 Supabase까지 태평양을 왕복한다. `icn1`로 고정할 것.

---

## 다음 단계 (이 문서 밖)

설계서의 **$1 검증**이 아직 안 끝났다면 그게 먼저다 — 스튜디오로 캐릭터를 하나 만들고, 폰으로 10초 찍고, fal.ai 콘솔에서 Wan-Animate Replace에 넣어보기. 여기에 joyosapp을 설치해 같은 소스로 돌려 나란히 비교하면 품질 기준선이 생긴다.

결과가 인스타에 올릴 수준이면 위 S0부터 시작하고, 아니면 웹을 짓기 전에 방향부터 다시 본다.
