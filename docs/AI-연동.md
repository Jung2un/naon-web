# AI 모델 연동

## 모델
- 이미지: Gemini 3.1 Flash Image (`gemini-3.1-flash-image`). 캐릭터 후보, 참조 이미지 편집, 3방향, 룩 생성에서 공통으로 사용한다. `GEMINI_IMAGE_MODEL`로 교체 가능. Lite 모델은 순차 편집 일관성이 덜 적합하므로 기본값에서 제외했다.
- 영상: fal.ai Wan VACE Video Edit (`fal-ai/wan-vace-apps/video-edit`), 720p. 원본 영상과 최종 적용 얼굴을 참조하고, 얼굴·머리만 편집하며 원본 의상·몸·배경을 유지하도록 지시한다. 의상 보존은 생성 모델의 지시 이행에 의존하므로 배포 후 실제 결과 비교가 필요하다.
- 키는 Supabase Edge Function 시크릿에만 저장한다. 웹에는 Supabase 공개 URL과 공개 키만 둔다.

## 계정 준비 (계정 소유자가 진행)
1. https://aistudio.google.com/ 에 Google 계정으로 가입하고 약관에 동의한다. API 키의 프로젝트에 결제를 연결한다.
2. https://fal.ai/ 에 가입하고 결제/잔액을 준비한 뒤 API 키를 만든다.
3. Supabase 프로젝트의 Edge Functions → Secrets에서 `GEMINI_API_KEY`, `FAL_KEY`를 등록한다. 기존 `WEBHOOK_SECRET`은 유지한다.
4. `GEMINI_IMAGE_MODEL=gemini-3.1-flash-image`를 등록한다(없어도 코드 기본값 사용).
5. 로컬 연결도 필요하면 `ALLOWED_APP_ORIGINS=http://localhost:3300`을 등록한다. 쉼표로 정확한 origin을 추가할 수 있다.
키를 채팅, git, NEXT_PUBLIC 환경변수, Vercel 프런트엔드 환경변수에 넣지 않는다.

## 배포
마이그레이션 → Edge Functions → 타입 생성 → 웹 순서.
```
npx supabase db push
npx supabase functions deploy draft-character
npx supabase functions deploy refine-character
npx supabase functions deploy build-character
npx supabase functions deploy create-look
npx supabase functions deploy create-video
npx supabase functions deploy ai-status
npx supabase functions deploy fal-webhook
npx supabase gen types typescript --linked > src/types/database.ts
```
영상 관련 신규 RPC는 service_role만 실행 가능하다. 사용자 JWT와 소유권은 Edge Function과 RPC에서 검증한다.

## 영상 흐름
`/jobs/new`에서 완성한 캐릭터 선택 → private videos 버킷의 본인 폴더에 MP4 업로드 → create-video가 50MB·MP4 실제 길이 3~10초 검증 → 트랜잭션으로 1크레딧 차감과 job 생성 → fal 큐 제출 → HMAC 검증 웹훅 → 결과를 private 버킷으로 복사 → 트랜잭션으로 완료 또는 1회 환불.
같은 job ID 재요청은 다시 과금/큐 제출하지 않는다. 영상 큐 접수 응답이 유실된 경우 유료 요청을 자동 재전송하지 않는다. 이 경우 job은 대기로 남고 웹훅 또는 운영 확인을 기다린다.

## 운영 확인
- ai-status는 로그인 사용자에게 키 설정 여부만 반환한다. 결제 잔액과 모델 사용 권한을 보장하지 않는다.
- Gemini 요청은 110초, fal 접수는 25초 timeout. 키 누락은 차감 전에 차단한다.
- 영상 callback 저장/DB 실패는 HTTP 500으로 재전송을 요청한다. 오류로 즉시 환불하지 않는다.
- 큐 요청이 수락됐는지 불확실하거나 callback이 오지 않은 작업은 jobs.provider_request_id와 fal 대시보드를 대조한다. 실제 결과를 확인하기 전 동일 영상을 새 ID로 재전송하지 않는다. provider_request_id가 없으면 생성 시각으로 공급자 로그를 확인한다.
- 실패가 확인된 작업은 관리자 SQL에서 `finish_video_job(job UUID, null, 'UPSTREAM_ERROR')`로 1회 환불할 수 있다. 진행 중인 작업을 임의 환불하면 늦게 도착한 결과는 무시된다.
- 실제 키가 등록되기 전에는 유료 생성·변환의 종단 간 결과를 검증할 수 없다. mock 계약 테스트와 빌드 검증을 사용한다.

## 공식 문서
- https://ai.google.dev/gemini-api/docs/image-generation
- https://fal.ai/models/fal-ai/wan-vace-apps/video-edit/api
- https://fal.ai/docs/documentation/model-apis/inference/queue

## 2026-10-07 수정 및 검증
- 캐릭터 완성은 마지막으로 적용한 `base_image_path`를 정면과 썸네일에 그대로 사용하고 좌우만 생성한다. 이전 후보를 명시적으로 다시 선택한 경우에는 그 선택을 존중한다.
- 영상은 인물 전체를 바꾸는 Animate Replace에서 지시 기반 편집 모델로 변경했다. 새 작업에는 룩 이미지를 전달하지 않으며, 기존 작업 재요청은 기존 작업을 반환한다.
- `npm run test:prompts`, `npm run test:generation`, `npm run test:db`로 요청 형식, 최종 얼굴 경로, 각도 실패 및 반복 정산을 검증한다. 자동 테스트는 실제 생성 품질을 보장하지 않는다.
- 이 변경에는 DB 마이그레이션이 없다. `build-character`, `create-video`, `fal-webhook`을 배포한 뒤 같은 원본으로 얼굴 일치, 의상·로고·소매·액세서리 보존, 동작·길이를 비교해야 한다. 의상 변경이 남으면 마스크 기반 합성 등 추가 처리가 필요하다.
- README GIF는 수정 전 배포 화면의 기록이다. 새 영상 모델의 비용·대기 시간·시각 품질은 아직 실측하지 않았다.
