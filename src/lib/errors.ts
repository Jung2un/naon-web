/**
 * 에러는 사람 말로. — CLAUDE.md 문구 규칙
 * `FAL_422` 같은 코드를 화면에 그대로 내보내지 않는다.
 */

const MESSAGES: Record<string, string> = {
  // 변환 파이프라인
  FAL_422: "얼굴이 프레임을 벗어난 구간이 있어요. 다시 찍어 주세요.",
  FACE_NOT_FOUND: "영상에서 얼굴을 찾지 못했어요. 밝은 곳에서 다시 찍어 주세요.",
  MULTIPLE_FACES: "여러 사람이 보여요. 혼자 나오는 영상으로 다시 찍어 주세요.",
  VIDEO_TOO_LONG: "영상이 너무 길어요. 10초 이내로 찍어 주세요.",
  VIDEO_TOO_SHORT: "영상이 너무 짧아요. 3초 이상 찍어 주세요.",
  LOW_RESOLUTION: "화질이 낮아 변환할 수 없어요. 720p 이상으로 찍어 주세요.",
  TIMEOUT: "변환이 예상보다 오래 걸려 중단됐어요. 크레딧은 돌려드렸어요.",
  UPSTREAM_ERROR: "변환 서버에 문제가 있었어요. 크레딧은 돌려드렸어요.",

  // 캐릭터 만들기 — docs/기획서.md
  TRAITS_INCOMPLETE: "톤과 성별·나이대를 골라 주세요.",
  NO_CHANGES: "바꿀 항목을 골라 주세요. 지금은 고른 게 그대로예요.",
  CHARACTER_BUSY: "아직 뽑는 중이에요. 끝나면 이어서 할 수 있어요.",
  CHARACTER_NOT_FOUND: "그 캐릭터를 찾을 수 없어요. 목록에서 다시 골라 주세요.",
  CHARACTER_NOT_READY:
    "캐릭터가 아직 준비되지 않았어요. 얼굴을 고르고 완성한 뒤에 쓸 수 있어요.",

  // 룩
  LOOK_INCOMPLETE: "머리·상의·하의·장소를 다 골라 주세요.",

  // 크레딧
  INSUFFICIENT_CREDITS: "크레딧이 모자라요. 충전하고 다시 시도해 주세요.",

  // 인증
  OAUTH_CANCELLED: "로그인을 취소했어요.",
  OAUTH_FAILED: "로그인에 실패했어요. 잠시 뒤 다시 시도해 주세요.",
  SESSION_EXPIRED: "로그인이 만료됐어요. 다시 로그인해 주세요.",
};

const FALLBACK = "문제가 생겼어요. 잠시 뒤 다시 시도해 주세요.";

export function humanError(code: string | null | undefined): string {
  if (!code) return FALLBACK;
  return MESSAGES[code] ?? FALLBACK;
}

/** 지원 요청 시에만 쓰는 원본 코드. 본문 옆 캡션으로만 노출한다. */
export function errorCodeHint(code: string | null | undefined): string | null {
  if (!code) return null;
  return MESSAGES[code] ? null : code;
}
