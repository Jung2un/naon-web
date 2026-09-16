# AI 대역 — 디자인 시스템

Lovable DESIGN.md(VoltAgent/awesome-design-md)를 기반으로, 이 프로젝트의 **웹 관리 화면**에 맞게 번역한 문서다.

> **이미 번역이 끝난 문서다.** 원본은 마케팅 사이트용이라 섹션 간격이 80–208px, 제목이 60px다. 여기 적힌 값은 전부 대시보드 밀도로 이미 줄여놓은 것이니 **다시 줄이지 마라.** 원본 Lovable 문서를 참고해야 할 일이 생기면 색·테두리·라운드·inset shadow 규칙만 가져오고 크기는 이 문서를 따른다.

기획: `docs/기획서.md`

---

## 1. 이 시스템의 성격

크림 배경(`#f7f4ed`) 위에 차콜(`#1c1c1c`) 텍스트. 개발자 툴 사이트 특유의 차가운 순백 대신 따뜻한 종이 같은 바탕을 쓴다. **순백을 페이지 배경으로 쓰지 않는 것이 이 시스템의 첫 번째 규칙이다.**

깊이는 얕다. 카드를 그림자로 띄우지 않고 `1px solid #eceae4` 테두리로 담는다. 유일한 입체 표현은 어두운 버튼의 **inset shadow** — 표면에 눌러 넣은 듯한 촉감을 만드는 다층 기법이고, 이 시스템의 시그니처라 절대 빼지 않는다.

회색은 전부 `#1c1c1c`의 투명도에서 파생시킨다. 임의의 회색 hex를 새로 만들면 색이 서로 안 맞기 시작한다.

웨이트는 **400과 600 둘뿐**이다. 700은 쓰지 않는다.

### 원본에서 의도적으로 바꾼 것

| 항목 | Lovable 원본 | 이 프로젝트 | 이유 |
|---|---|---|---|
| 섹션 간격 | 80–208px | **24–56px** | 대시보드는 한 화면에 정보가 들어가야 한다 |
| 페이지 제목 | 60px / -1.5px | **30px / -0.6px** | 위와 같음 |
| 폰트 | Camera Plain Variable | **Pretendard + Figtree** | 원본은 상용 폰트 |
| 상태 색 | 정의 없음 | **§4에서 정의** | 원본은 마케팅 사이트라 상태가 없다 |
| 다크 모드 | 없음 | **만들지 않음** | 크림 배경이 정체성이다. 뒤집으면 남는 게 없다 |
| 브랜드 버튼 | 없음 | **색 규칙 면제** | Google/Kakao 로그인 버튼은 각 사 가이드라인을 따라야 한다 |

---

## 2. 색

### 토큰

```css
:root {
  /* 바탕 */
  --bg-cream:          #f7f4ed;   /* 페이지 배경, 카드 배경, 사이드바 */
  --surface-sunken:    #f0eee7;   /* 입력 필드, 코드 블록 — #1c1c1c 3%를 크림 위에 올린 값 */

  /* 글자 */
  --text-primary:      #1c1c1c;   /* 제목, 본문 */
  --text-body:         rgba(28,28,28,0.82);
  --text-muted:        #5f5f5d;   /* 캡션, 보조 정보 */
  --text-on-dark:      #fcfbf8;   /* 차콜 배경 위 글자 */

  /* 선 */
  --border-subtle:     #eceae4;   /* 카드, 구분선, 이미지 테두리 */
  --border-interactive: rgba(28,28,28,0.4);  /* 아웃라인 버튼, 선택 상태 */

  /* 표면 상호작용 */
  --hover-subtle:      rgba(28,28,28,0.04);  /* 호버 배경, 활성 네비 */
  --overlay-faint:     rgba(28,28,28,0.03);  /* 거의 안 보이는 겹침 */
  --ring-subtle:       rgba(28,28,28,0.10);  /* 입력 포커스 링 — 드래그 선택(0.12)과 같은 계열 */

  /* 상태 — §4 */
  --status-error:      #b3261e;
  --status-error-bg:   rgba(179,38,30,0.06);
  --status-error-line: rgba(179,38,30,0.25);

  /* 깊이 */
  --shadow-inset:
    rgba(255,255,255,0.2) 0px 0.5px 0px 0px inset,
    rgba(0,0,0,0.2) 0px 0px 0px 0.5px inset,
    rgba(0,0,0,0.05) 0px 1px 2px 0px;
  --shadow-focus:      rgba(0,0,0,0.1) 0px 4px 12px;
  --shadow-overlay:    rgba(28,28,28,0.12) 0px 8px 32px;  /* 다이얼로그 전용 */
  --ring:              rgba(59,130,246,0.5);              /* 키보드 포커스 링 */
}
```

### 규칙

- **회색을 새로 만들지 않는다.** 위 목록에 없는 회색이 필요하면 `rgba(28,28,28,X)`로 만들고, 쓰기 전에 이 문서에 추가한다.
- `--surface-sunken`은 발명한 색이 아니라 `#1c1c1c`를 3% 불투명도로 크림 위에 올린 결과값이다. 입력 필드를 크림 배경과 구분해야 할 때만 쓴다.
- **채도 있는 색을 강조에 쓰지 않는다.** 예외는 셋뿐 — 실패 상태(`--status-error`), 키보드 포커스 링, OAuth 브랜드 버튼.
- 초록색 "성공" 배지를 만들지 않는다. 완료는 차콜로 칠한다.

### 대비 (검증됨)

| 조합 | 비율 | 판정 |
|---|---|---|
| `#1c1c1c` on `#f7f4ed` | 15.9:1 | AAA |
| `#5f5f5d` on `#f7f4ed` | 5.9:1 | AA |
| `#b3261e` on `#f7f4ed` | 6.0:1 | AA |
| `#fcfbf8` on `#1c1c1c` | 15.4:1 | AAA |

---

## 3. 타이포그래피

### 폰트

```css
--font-sans:    "Pretendard Variable", Pretendard, -apple-system,
                BlinkMacSystemFont, system-ui, sans-serif;
--font-display: "Figtree", "Pretendard Variable", Pretendard, system-ui, sans-serif;
```

`--font-display`는 라틴 글자와 숫자만 Figtree로 렌더되고 한글은 Pretendard로 흘러내린다. Figtree를 고른 이유는 둥근 터미널과 유기적인 곡선이 원본 Camera Plain Variable에 가장 가깝기 때문이다.

> Camera Plain Variable을 구입하면 `--font-display` 한 줄만 바꾸면 된다. 그러라고 분리해둔 것이니 컴포넌트에서 폰트 이름을 직접 쓰지 마라.

### 스케일

| 역할 | 크기 | 웨이트 | 행간 | 자간 | 폰트 |
|---|---|---|---|---|---|
| 페이지 제목 | 30px | 600 | 1.15 | -0.6px | display |
| 섹션 제목 | 20px | 600 | 1.25 | -0.3px | display |
| 카드 제목 | 16px | 400 | 1.35 | normal | sans |
| 본문 | 15px | 400 | 1.55 | normal | sans |
| 본문 작게 | 14px | 400 | 1.50 | normal | sans |
| 버튼 | 14px | 400 | 1.50 | normal | sans |
| 캡션 | 13px | 400 | 1.45 | normal | sans |
| 라벨 (대문자) | 11px | 600 | 1.40 | 0.08em | sans |
| 지표 (큰 숫자) | 36px | 600 | 1.00 | -0.8px | display + tabular |
| 지표 작게 | 20px | 600 | 1.10 | -0.3px | display + tabular |

### 규칙

- **큰 글자에만 음수 자간**을 준다. 15px 이하에는 자간을 건드리지 않는다.
- 제목에 자간을 **늘리지** 않는다. 유일한 예외가 11px 대문자 라벨(`0.08em`)이다.
- 읽는 본문은 한 줄 65자 근처에서 끊는다.
- 제목에는 `text-wrap: balance`.
- **숫자가 세로로 정렬되는 곳은 전부 `font-variant-numeric: tabular-nums`.** 크레딧 잔량, 사용 내역, 작업물 길이, 소모 크레딧이 해당한다.

---

## 4. 상태 표현 — 원본에 없는 확장

원본은 "채도 있는 강조색을 쓰지 말라"고 한다. 대시보드는 작업 상태를 구분해야 하므로 이 지점만 규칙을 넓힌다.

**색만으로 구분하지 않는다. 형태를 같이 쓴다.** 색맹 사용자와 흑백 스크린샷에서도 읽혀야 한다.

| 상태 | 배경 | 테두리 | 글자 | 아이콘 |
|---|---|---|---|---|
| `queued` 대기 | 투명 | `--border-interactive` | `--text-body` | 빈 원 |
| `processing` 처리 중 | 투명 | `--border-interactive` | `--text-body` | 회전하는 링 |
| `done` 완료 | `#1c1c1c` | 없음 + `--shadow-inset` | `--text-on-dark` | 체크 |
| `failed` 실패 | `--status-error-bg` | `--status-error-line` | `--status-error` | 느낌표 |

크림 배경 위에서 **유일하게 튀는 색이 실패**여야 눈이 거기로 간다. 완료를 초록으로 칠하면 그 효과가 사라진다.

배지 치수: 높이 22px, 좌우 패딩 8px, 아이콘과 글자 사이 5px, 글자 12px/400, 라운드 `9999px`.

---

## 5. 간격과 레이아웃

### 스케일

기본 단위 4px. `4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 56 · 72`

| 자리 | 값 |
|---|---|
| 카드 안쪽 패딩 | 16–20px |
| 그리드 간격 | 16px |
| 섹션 사이 | 24–56px |
| 페이지 좌우 여백 | 24px (모바일 16px) |
| 사이드바 폭 | 240px |
| 컨텐츠 최대 폭 | 1200px |

### 라운드

| 이름 | 값 | 쓰는 곳 |
|---|---|---|
| micro | 4px | 작은 배지 |
| standard | 6px | 버튼, 입력, 네비 아이템 |
| compact | 8px | 조밀한 카드 |
| card | 12px | 카드, 이미지, 썸네일 |
| container | 16px | 다이얼로그, 큰 컨테이너 |
| pill | 9999px | 상태 배지, 필터 필, 아이콘 버튼 |

**사각 버튼에 `9999px`를 쓰지 않는다.** 필 라운드는 배지·필터·아이콘 버튼 전용이다.

### 깊이

| 단계 | 처리 | 쓰는 곳 |
|---|---|---|
| 0 | 그림자 없음, 크림 | 페이지 바탕, 사이드바 |
| 1 | `1px solid #eceae4` | 카드, 이미지, 구분선 |
| 2 | `--shadow-inset` | 어두운 버튼, 완료 배지 |
| 3 | `--shadow-focus` | 포커스·활성 상태 |
| 4 | `--shadow-overlay` | **다이얼로그 · Select 목록** |

4단계는 원본에 없는 확장이다. 떠 있는 층은 배경과 분리돼야 하므로 예외로 둔다.
**카드에는 절대 쓰지 않는다.**

---

## 6. 컴포넌트

### 버튼

| 종류 | 배경 | 글자 | 테두리 | 쓰는 곳 |
|---|---|---|---|---|
| Primary | `#1c1c1c` | `--text-on-dark` | `--shadow-inset` | 화면당 하나 |
| Outline | 투명 | `--text-primary` | `1px solid --border-interactive` | 보조 동작 |
| Ghost | 투명 | `--text-primary` | 없음, 호버 시 `--hover-subtle` | 세 번째 동작, 툴바 |
| Destructive | 투명 | `--status-error` | `1px solid --status-error-line` | 삭제 |

공통: 라운드 6px, 패딩 8px 16px, 글자 14px/400, active 시 `opacity: 0.8`, 포커스는 `--shadow-focus`.
Primary 버튼의 inset shadow는 **빼지 않는다.**

터치 대상은 최소 44×44px. 시각적 높이가 그보다 작으면 투명 패딩으로 채운다.

### OAuth 브랜드 버튼 — 색 규칙 면제

Google과 Kakao는 로그인 버튼 디자인 가이드라인이 있고, 따르지 않으면 심사에서 걸린다. **이 시스템에서 브랜드 색이 허용되는 유일한 자리다.**

- **Google**: 흰 배경 + `1px solid #dadce0` + `#3c4043` 글자 + 공식 G 로고. 여기서만 순백을 허용한다.
- **Kakao**: `#FEE500` 배경 + `rgba(0,0,0,0.85)` 글자 + 공식 말풍선 로고.
- 공통: 라운드 6px, 높이 48px, 폭 100%, 글자 15px. 로고는 왼쪽 정렬, 텍스트는 가운데.
- 이 두 개 말고 다른 곳에 브랜드 색을 끌어다 쓰지 않는다.

### 카드

크림 배경 + `1px solid --border-subtle` + 라운드 12px. **box-shadow 없음.**
안쪽 패딩 16–20px. 호버로 반응해야 하는 카드는 테두리를 `--border-interactive`로 진하게 (그림자를 주지 않는다).

### 입력

배경 `--surface-sunken`, 테두리 `1px solid --border-subtle`, 라운드 6px, 높이 40px, 글자 15px.
플레이스홀더 `--text-muted`.

**포커스는 차콜 계열로 맞춘다.** 테두리를 `--border-interactive`로 진하게 바꾸고
바깥에 `--ring-subtle` 3px 링을 붙인다. 드래그 선택(`rgba(28,28,28,0.12)`)과 같은 톤이라
크림 바탕에서 화면이 한 색으로 읽힌다. **입력에는 파란 `--ring`을 쓰지 않는다** —
`--ring`은 버튼·링크 같은 나머지 요소의 키보드 포커스용으로 남긴다.

에러는 포커스보다 우선한다. 에러 시 테두리 `--status-error-line`을 유지하고
아래에 13px `--status-error` 메시지.

`input` · `textarea`가 같은 규칙을 쓴다 (`src/components/ui/input.tsx`).

### 선택 (Select)

**네이티브 `<select>`를 쓰지 않는다.** `<option>`은 OS가 그려서 크림 배경도, 라운드도,
차콜 하이라이트도 안 먹는다(Safari는 배경색조차 무시한다). 목록을 직접 그린다 —
`src/components/ui/select.tsx`.

- **트리거**: 입력과 완전히 같다. 높이 40px, 배경 `--surface-sunken`,
  `1px solid --border-subtle`, 라운드 6px, 오른쪽에 16px lucide `ChevronDown` (`--text-muted`).
  포커스와 펼친 상태(`data-[state=open]`) 모두 테두리 `--border-interactive`.
- **목록**: 크림 배경 + `1px solid --border-subtle` + 라운드 8px + `--shadow-overlay`.
  깊이 4단계를 쓰는 두 번째 자리다 — 다이얼로그와 같은 이유로, 떠 있는 층은 배경과
  분리돼야 한다. 카드에는 여전히 쓰지 않는다.
  최대 높이 320px, 넘치면 위아래 스크롤 버튼.
- **항목**: 14px/400 `--text-body`, 라운드 6px, 패딩 8px 12px.
  하이라이트(키보드·마우스) = `--hover-subtle` 배경 + `--text-primary`.
  선택됨 = 오른쪽에 16px 차콜 체크. **선택 표시에 채도 있는 색을 쓰지 않는다.**
  비활성 항목은 `opacity: 0.4`.

### 사이드바

폭 240px, 크림 배경, 오른쪽 `1px solid --border-subtle`.
네비 아이템: 14px/400, 라운드 6px, 패딩 8px 12px, 아이콘 16px(lucide), 최소 높이 44px.
활성 = `--hover-subtle` 배경 + `--text-primary`. 비활성 = `--text-muted`.
**활성 표시에 채도 있는 색이나 왼쪽 강조 바를 쓰지 않는다.**
1024px 미만에서는 상단 바 + **하단 탭**으로 바뀐다 (아래 참고).

### 하단 탭 (모바일)

1024px 미만에서만 선다. 햄버거 시트를 대신한다 — 시트는 화면 맨 위 구석까지
손을 뻗어 열고·고르고·닫는 세 동작이 들고 그동안 현재 위치도 안 보인다.
탭은 엄지 자리에서 한 번에 끝나고 어디에 있는지가 늘 보인다.

- 높이 56px + `padding-bottom: env(safe-area-inset-bottom)`, 크림 배경, 위쪽 `1px solid --border-subtle`.
- 칸은 다섯이다: **홈 · 캐릭터 · 룩 · 작업물 · 더보기.** 여섯 개를 한 줄에 넣으면 칸마다 44px을 못 채운다.
  자주 누르지 않는 **크레딧 · 설정**은 더보기 시트로 내린다.
- 아이콘 20px(lucide) + 라벨 12px. 활성 = `--text-primary` + 웨이트 600, 비활성 = `--text-muted`.
  **사이드바와 같은 규칙이다 — 채도 있는 색이나 강조 바를 쓰지 않는다.**
- 더보기 시트는 화면 **아래**에서 올라온다. 여는 손과 닫는 손이 같은 자리에 있어야 한다.

본문 아래 여백과 하단 고정 바는 `--bottom-nav-h`(탭 높이 + 안전영역)만큼 비켜간다.
1024px 이상에서 이 값은 `0px`이라 데스크톱 레이아웃은 그대로다.

상단 바에는 로고와 **크레딧 잔량**만 둔다. 잔량은 "가는 곳"이 아니라 "보는 값"이라
탭 한 칸을 내줄 이유가 없다. 누르면 충전 화면으로 간다.

### StatusBadge

§4의 표대로. `src/components/app/StatusBadge.tsx`.
`processing`의 회전은 800ms linear infinite. `prefers-reduced-motion: reduce`에서는 회전 대신 투명도 펄스(1.6s)로 바꾼다.

### JobCard

9:16 썸네일, 라운드 12px, `1px solid --border-subtle`, 배경 `#1c1c1c`(레터박스).
StatusBadge를 썸네일 좌상단에 8px 안쪽으로 절대 배치.
아래: 캐릭터 이름 14px/400, 상대 시각 13px `--text-muted`.
그리드 — 데스크톱 4열 / 태블릿 3열 / 모바일 2열, 간격 16px.

### CreditStrip

카드(크림 + 테두리 + 12px), 패딩 20px.
잔량은 지표 스케일 36px/600 `tabular-nums`. 라벨은 13px `--text-muted`.
오른쪽에 Outline 버튼 "충전". 잔량이 3 미만이면 버튼을 Primary로 승격한다.

### PresetTile

1:1 정사각, 라운드 12px, `1px solid --border-subtle`.
선택됨 = 테두리 `--border-interactive` + 우상단에 차콜로 채운 20px 원 안에 흰 체크 + `--shadow-focus`.
**선택 상태에 채도 있는 색을 쓰지 않는다.** 아래 라벨 13px, 두 줄까지 허용.

### TraitChip (캐릭터 속성)

캐릭터의 성별·나이대·머리·색·체형·분위기를 고르는 칩. **필 라운드가 허용되는 자리다**(필터 필).
높이 32px, 좌우 패딩 12px, 글자 14px/400, 라운드 `9999px`.
기본 = 투명 배경 + `1px solid --border-subtle` + `--text-body`, 호버 시 `--hover-subtle`.
선택됨 = `#1c1c1c` 배경 + `--text-on-dark` + `--shadow-inset`. 체크 아이콘은 넣지 않는다 — 채움으로 이미 읽힌다.
한 번 더 누르면 해제된다(선택 항목만). 줄바꿈으로 흐르고, 터치 대상은 세로 여백으로 44px를 채운다.

### ToneTile (캐릭터 톤)

`PresetTile`과 같은 규칙이다 — 1:1, 라운드 12px, 선택 표시도 같다.
다른 점은 아래 라벨이 두 줄(이름 13px `--text-primary` + 설명 13px `--text-muted`)이라는 것뿐이다.

### 후보 그리드 (캐릭터 스튜디오 2단계)

3:4 네 칸, 간격 16px, 데스크톱 4열 / 모바일 2열.
**뽑는 동안 같은 자리에 같은 치수의 스켈레톤이 선다.** 도착한 칸부터 채워지고 자리는 안 흔들린다.
고른 칸은 `PresetTile`의 선택 표시를 쓴다. 실패한 칸은 `--status-error-bg` 위에 13px 실패 문구.

### 버전 스트립 (캐릭터 스튜디오 3단계)

지금 얼굴과 이전 버전들을 가로로 늘어놓는다. 64×80px 썸네일, 라운드 8px, 간격 8px, 가로 스크롤.
지금 것 = 테두리 `--border-interactive` + `--shadow-focus`. 나머지는 `--border-subtle`.
**되돌리기는 무료 동작이라 확인 다이얼로그를 띄우지 않는다.** 누르면 바로 그 버전이 지금 얼굴이 된다.

### SummaryBar (룩 만들기 하단 고정)

크림 배경, 위쪽 `1px solid --border-subtle`, 패딩 16px 24px.
왼쪽: 선택 요약을 가운뎃점으로 이어서 15px (`긴 웨이브 · 니트 · 데님 · 카페`).
오른쪽: 소모 크레딧(`tabular-nums`) + Primary 버튼.
4슬롯이 다 안 골라지면 버튼 비활성 + 남은 슬롯 이름을 알려준다.

모바일에서는 `sticky bottom: var(--bottom-nav-h)` — 하단 탭 **바로 위**에 붙는다.
좁은 폭에서는 요약·크레딧을 윗줄에 두고 버튼을 아랫줄에 폭 전체로 깔며 높이를 48px로 키운다.
한 줄에 셋을 우겨넣으면 버튼이 먼저 찌그러진다.

> **이 바를 래퍼 `<div>`로 감싸지 마라.** `sticky`는 부모 박스 안에서만 움직인다.
> 래퍼 높이가 바 높이와 같아지면 움직일 공간이 0이라 그냥 안 붙는다.
> 바깥 여백이 필요하면 `className`으로 바 자체에 준다. — `src/components/app/ActionBar.tsx`

### Stepper

가로 3단계. 완료 = 차콜 테두리 원 + 체크. 현재 = 차콜로 채운 원 + 라벨 600.
예정 = `--border-interactive` 원 + `--text-muted` 라벨.
연결선 `--border-subtle`, 지나온 구간은 `#1c1c1c`.

### EmptyState

가운데 정렬, 최대 폭 420px, 위아래 여백 56px.
72px 원(크림 + `1px solid --border-subtle`) 안에 40px lucide 아이콘.
제목 20px/600, 설명 15px `--text-muted`, **버튼은 정확히 하나.**
빈 상태는 나중이 아니라 처음에 만든다. 신규 사용자가 보는 첫 화면이 항상 이것이다.

### 다이얼로그

크림, 라운드 16px, `1px solid --border-subtle`, `--shadow-overlay`.
오버레이는 `rgba(28,28,28,0.32)`. 최대 폭 480px, 패딩 24px.
제목 20px/600, 본문 15px. 버튼은 오른쪽 정렬, 취소(Ghost) → 확인(Primary) 순.
삭제 확인은 확인 버튼을 Destructive로.

### 표 (사용 내역)

행 구분은 `1px solid --border-subtle` 하단 선. **줄무늬 배경을 쓰지 않는다.**
헤더는 11px 대문자 라벨 스타일, `--text-muted`.
숫자 열은 오른쪽 정렬 + `tabular-nums`. **음수를 빨강으로 칠하지 않는다** — 크레딧 차감은 정상 동작이지 에러가 아니다.

### 이미지

모든 이미지에 `1px solid --border-subtle` + 라운드 12px + `max-width: 100%`.
로딩 중에는 같은 치수의 스켈레톤(`--overlay-faint` 배경, 1.4s 펄스).

---

## 7. 모션

| 대상 | 길이 | 이징 |
|---|---|---|
| 호버·활성 | 150ms | ease-out |
| 다이얼로그 · 시트 | 200ms | ease-out |
| 스켈레톤 펄스 | 1.4s | ease-in-out infinite |
| 처리 중 스피너 | 800ms | linear infinite |

`prefers-reduced-motion: reduce`에서 **모든 transition과 animation을 끈다.** 단 처리 중 상태는 뭔가 진행되고 있다는 신호가 필요하므로 회전 대신 느린 투명도 펄스로 대체한다.

페이지 진입 애니메이션을 만들지 않는다. 대시보드는 하루에 여러 번 열리는 화면이라 그때마다 기다리게 하면 안 된다.

---

## 8. 반응형

| 폭 | 변화 |
|---|---|
| < 640px | 사이드바 → 상단 바 + 하단 탭. 작업물 2열. 좌우 여백 16px. SummaryBar는 탭 위에 고정, 버튼 전체폭 |
| 640–1024px | 작업물 3열. 하단 탭 유지. SummaryBar 한 줄로 복귀 |
| 1024–1280px | 하단 탭 사라짐(`--bottom-nav-h: 0`). 사이드바 고정 240px. 작업물 4열 |
| > 1280px | 컨텐츠 최대 1200px 가운데 정렬 |

375px에서 **가로 스크롤이 생기면 버그다.** 넓은 표만 예외로 자기 컨테이너에 `overflow-x: auto`를 갖는다.
9:16 영상 플레이어는 `max-height: 70vh` — 세로 영상이 화면을 다 먹지 않게.

---

## 9. 해도 되는 것 / 하면 안 되는 것

### 해도 되는 것
- 크림 `#f7f4ed`을 모든 바탕에
- 회색을 `#1c1c1c` 투명도에서 파생
- `#eceae4` 테두리로 담기
- 어두운 버튼에 inset shadow
- 웨이트 400과 600만
- 숫자에 `tabular-nums`
- 필 라운드는 배지·필터·아이콘 버튼에만
- active 시 `opacity: 0.8`

### 하면 안 되는 것
- 순백 `#ffffff`을 페이지나 카드 배경으로 (Google 로그인 버튼만 예외)
- 카드에 무거운 box-shadow
- 채도 있는 강조색 (실패 상태·포커스 링·OAuth 브랜드 버튼만 예외)
- `font-weight: 700`
- 사각 버튼에 `9999px` 라운드
- 날카로운 포커스 아웃라인 — 소프트 섀도로
- 초록색 성공 배지
- 이모지를 UI 아이콘으로 (lucide-react를 쓴다)
- 다크 모드
- 이 문서에 없는 hex 색

---

## 10. 에이전트용 빠른 참조

```
페이지 배경      #f7f4ed
제목·본문 글자   #1c1c1c
보조 글자        #5f5f5d
테두리           #eceae4
상호작용 테두리  rgba(28,28,28,0.4)
호버 배경        rgba(28,28,28,0.04)
Primary 버튼     #1c1c1c 배경 / #fcfbf8 글자 / 6px / inset shadow
실패             #b3261e
포커스           rgba(0,0,0,0.1) 0px 4px 12px

제목 30px/600/-0.6px · 섹션 20px/600/-0.3px · 본문 15px/400 · 캡션 13px/400
라운드 6(버튼) 12(카드) 16(다이얼로그) 9999(배지)
간격 4 8 12 16 20 24 32 40 56 72
```

### 예시 프롬프트

**카드 그리드**
> 크림(`#f7f4ed`) 위에 카드 그리드. 카드는 크림 배경 + `1px solid #eceae4` + 라운드 12px, box-shadow 없음. 안쪽 패딩 20px. 제목 16px weight 400 `#1c1c1c`, 보조 13px `#5f5f5d`. 간격 16px, 데스크톱 4열 → 모바일 2열.

**기본 버튼**
> `#1c1c1c` 배경, `#fcfbf8` 글자, 라운드 6px, 패딩 8px 16px, 글자 14px weight 400. box-shadow에 `rgba(255,255,255,0.2) 0px 0.5px 0px 0px inset, rgba(0,0,0,0.2) 0px 0px 0px 0.5px inset, rgba(0,0,0,0.05) 0px 1px 2px 0px`. active에서 opacity 0.8, 포커스에서 `rgba(0,0,0,0.1) 0px 4px 12px`.

**지표 블록**
> 숫자 36px weight 600 자간 -0.8px `tabular-nums` `#1c1c1c`. 라벨 13px weight 400 `#5f5f5d`. 크림 카드 안, 패딩 20px.

### 반복 점검 체크리스트
1. 페이지 배경이 크림인가 (순백이 아닌가)
2. 새로 만든 회색 hex가 있는가
3. 카드가 그림자 대신 테두리로 담겼는가
4. weight 700이 있는가
5. 기본 버튼에 inset shadow가 있는가
6. 숫자 열에 `tabular-nums`가 붙었는가
7. 상태를 색만으로 구분하지 않았는가
8. 375px에서 가로 스크롤이 생기는가
