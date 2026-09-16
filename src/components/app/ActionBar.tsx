"use client";

import { Button } from "@/components/ui/button";
import { credits } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * DESIGN.md §6 — SummaryBar
 * 크림 배경, 위쪽 1px 선, 모바일에서는 화면 하단 sticky.
 * 왼쪽에 고른 것, 오른쪽에 소모 크레딧(tabular)과 Primary 버튼.
 *
 * 룩 만들기(`SummaryBar`)와 캐릭터 스튜디오가 같은 바를 쓴다.
 * 문구를 고르는 일은 부르는 쪽이 한다 — 바는 모양만 안다.
 */
export function ActionBar({
  summary,
  cost,
  label,
  pendingLabel = "만드는 중…",
  pending,
  disabled,
  onSubmit,
  secondary,
  className,
}: {
  summary: React.ReactNode;
  cost: number;
  label: string;
  pendingLabel?: string;
  pending?: boolean;
  disabled?: boolean;
  onSubmit: () => void;
  secondary?: React.ReactNode;
  /**
   * 바깥 여백은 여기로 받는다. 이 바를 `<div className="mt-8">` 같은 래퍼로
   * 감싸면 안 된다 — sticky는 부모 박스 안에서만 움직이는데 래퍼 높이가 바 높이와
   * 같아지면 움직일 공간이 0이라 그냥 안 붙는다.
   */
  className?: string;
}) {
  return (
    /*
      모바일에서는 하단 탭 바로 위에 붙는다(--bottom-nav-h). 탭이 없는 1024px
      이상에서는 그 값이 0이라 기존처럼 화면 바닥에 붙는다.

      좁은 폭에서 요약·크레딧·버튼을 한 줄에 우겨넣으면 버튼이 먼저 찌그러진다.
      그래서 모바일은 위에 요약 한 줄, 아래에 폭을 다 쓰는 버튼으로 쌓는다.
    */
    <div
      className={cn(
        "sticky bottom-[var(--bottom-nav-h,0px)] z-30 -mx-4 border-t border-line bg-cream px-4 py-3 sm:-mx-6 sm:px-6 sm:py-4 lg:static lg:mx-0 lg:rounded-[12px] lg:border lg:px-6",
        className,
      )}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
        <div className="flex min-w-0 items-baseline justify-between gap-3 sm:flex-1">
          <p className="min-w-0 flex-1 truncate text-base text-ink sm:whitespace-normal">
            {summary}
          </p>
          <span className="shrink-0 text-caption text-muted sm:hidden">
            크레딧 <span className="tabular text-ink">{credits(cost)}</span>
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="hidden text-caption text-muted sm:inline">
            크레딧 <span className="tabular text-ink">{credits(cost)}</span>
          </span>
          {secondary}
          {/* 모바일에서는 폭을 채우고 48px로 키운다 — 엄지로 겨냥하는 버튼이다 */}
          <Button
            variant="primary"
            onClick={onSubmit}
            disabled={disabled || pending}
            className="h-12 flex-1 sm:h-10 sm:flex-none"
          >
            {pending ? pendingLabel : label}
          </Button>
        </div>
      </div>
    </div>
  );
}
