/** 화면에서 쓰는 타입은 전부 생성된 `database.ts`에서 파생시킨다. */
import type { Database } from "./database";

type Tables = Database["public"]["Tables"];
type Enums = Database["public"]["Enums"];

export type JobStatus = Enums["job_status"];
export type RefAngle = Enums["ref_angle"];
export type PresetSlot = Enums["preset_slot"];
export type LedgerReason = Enums["ledger_reason"];

export type Profile = Tables["profiles"]["Row"];
export type Character = Tables["characters"]["Row"];
export type CharacterRef = Tables["character_refs"]["Row"];
export type Preset = Tables["presets"]["Row"];
export type Look = Tables["looks"]["Row"];
export type Job = Tables["jobs"]["Row"];
export type LedgerEntry = Tables["credit_ledger"]["Row"];

/** private 버킷 경로 대신 서버가 만든 signed URL을 붙여 내려주는 형태 */
export type WithSignedUrl<T, K extends string> = T & Record<K, string | null>;

export type CharacterListItem = Character & {
  thumbnail_url: string | null;
  look_count: number;
  job_count: number;
};

export type CharacterDetail = Character & {
  thumbnail_url: string | null;
  refs: Array<CharacterRef & { image_url: string | null }>;
  looks: LookListItem[];
  recent_jobs: JobListItem[];
};

export type LookListItem = Look & {
  thumbnail_url: string | null;
  character_name: string;
  preset_names: Record<PresetSlot, string>;
};

export type JobListItem = Job & {
  thumbnail_url: string | null;
  character_name: string;
  look_name: string | null;
};

export type JobDetail = JobListItem & {
  result_video_url: string | null;
  source_video_url: string | null;
};

export type PresetWithUrl = Preset & { thumbnail_url: string | null };

/** 룩 만들기에서 4슬롯을 고르는 중간 상태 */
export type SlotSelection = Partial<Record<PresetSlot, string>>;

export const PRESET_SLOTS: readonly PresetSlot[] = [
  "hair",
  "top",
  "bottom",
  "scene",
] as const;

export const SLOT_LABEL: Record<PresetSlot, string> = {
  hair: "머리",
  top: "상의",
  bottom: "하의",
  scene: "장소",
};

export const ANGLE_LABEL: Record<RefAngle, string> = {
  front: "정면",
  left45: "좌 45°",
  right45: "우 45°",
  left90: "좌 90°",
  right90: "우 90°",
};

/** 캐릭터 레퍼런스는 5각도. 순서가 화면 순서다. — README "이미 정해진 것" */
export const REF_ANGLES: readonly RefAngle[] = [
  "left90",
  "left45",
  "front",
  "right45",
  "right90",
] as const;

export const STATUS_LABEL: Record<JobStatus, string> = {
  queued: "대기",
  processing: "처리 중",
  done: "완료",
  failed: "실패",
};

export const LEDGER_REASON_LABEL: Record<LedgerReason, string> = {
  signup_bonus: "가입 보너스",
  job_charge: "영상 변환",
  job_refund: "변환 실패 환불",
  character_charge: "캐릭터 만들기",
  character_refund: "캐릭터 실패 환불",
  look_charge: "룩 만들기",
  look_refund: "룩 실패 환불",
  purchase: "크레딧 충전",
  adjustment: "조정",
};
