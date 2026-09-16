"use client";

import { Button } from "@/components/ui/button";
import { credits } from "@/lib/format";
import { PRESET_SLOTS, SLOT_LABEL, type PresetSlot } from "@/types/models";

/**
 * DESIGN.md §6 — SummaryBar (룩 만들기 하단 고정)
 * 왼쪽: 선택 요약을 가운뎃점으로 이어서 15px.
 * 오른쪽: 소모 크레딧(tabular-nums) + Primary 버튼.
 * 4슬롯이 다 안 골라지면 버튼 비활성 + 남은 슬롯 이름을 알려준다.
 */
export function SummaryBar({
  selectedNames,
  cost,
  pending,
  onSubmit,
}: {
  selectedNames: Partial<Record<PresetSlot, string>>;
  cost: number;
  pending?: boolean;
  onSubmit: () => void;
}) {
  const missing = PRESET_SLOTS.filter((slot) => !selectedNames[slot]);
  const chosen = PRESET_SLOTS.map((slot) => selectedNames[slot]).filter(Boolean);
  const complete = missing.length === 0;

  return (
    <div className="sticky bottom-0 z-30 -mx-4 border-t border-line bg-cream px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:rounded-[12px] lg:border lg:px-6 lg:pb-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="min-w-0 flex-1 text-base text-ink">
          {complete ? (
            chosen.join(" · ")
          ) : (
            <span className="text-muted">
              {missing.map((slot) => SLOT_LABEL[slot]).join(" · ")}를 고르면 만들
              수 있어요
            </span>
          )}
        </p>
        <div className="flex items-center gap-4">
          <span className="text-caption text-muted">
            크레딧 <span className="tabular text-ink">{credits(cost)}</span>
          </span>
          <Button
            variant="primary"
            onClick={onSubmit}
            disabled={!complete || pending}
          >
            {pending ? "만드는 중…" : "룩 만들기"}
          </Button>
        </div>
      </div>
    </div>
  );
}
