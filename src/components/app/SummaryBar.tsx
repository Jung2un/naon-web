"use client";

import { ActionBar } from "./ActionBar";
import { withObjectParticle } from "@/lib/format";
import { PRESET_SLOTS, SLOT_LABEL, type PresetSlot } from "@/types/models";

/**
 * DESIGN.md §6 — SummaryBar (룩 만들기 하단 고정)
 * 바의 모양은 `ActionBar`가 안다. 여기 있는 건 룩의 문구 규칙뿐이다 —
 * 4슬롯이 다 안 골라지면 버튼 비활성 + 남은 슬롯 이름을 알려준다.
 */
export function SummaryBar({
  selectedNames,
  cost,
  pending,
  onSubmit,
  className,
}: {
  selectedNames: Partial<Record<PresetSlot, string>>;
  cost: number;
  pending?: boolean;
  onSubmit: () => void;
  className?: string;
}) {
  const missing = PRESET_SLOTS.filter((slot) => !selectedNames[slot]);
  const chosen = PRESET_SLOTS.map((slot) => selectedNames[slot]).filter(Boolean);
  const complete = missing.length === 0;

  return (
    <ActionBar
      className={className}
      cost={cost}
      label="룩 만들기"
      pending={pending}
      disabled={!complete}
      onSubmit={onSubmit}
      summary={
        complete ? (
          chosen.join(" · ")
        ) : (
          <span className="text-muted">
            {withObjectParticle(missing.map((slot) => SLOT_LABEL[slot]).join(" · "))} 고르면 만들 수
            있어요
          </span>
        )
      }
    />
  );
}
