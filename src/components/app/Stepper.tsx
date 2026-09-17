import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** 단계 섹션에 붙이는 id. 스테퍼를 누르면 이 id로 스크롤한다 */
export const stepAnchor = (index: number) => `step-${index}`;

/**
 * 그 단계 섹션으로 부드럽게 내려간다. 섹션에는 scroll-mt를 줘서
 * 모바일 상단 바(56px)에 가려지지 않게 한다.
 */
export function scrollToStep(index: number) {
  document.getElementById(stepAnchor(index))?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

/**
 * DESIGN.md §6 — Stepper
 * 가로 3단계. 완료 = 차콜 테두리 원 + 체크. 현재 = 차콜로 채운 원 + 라벨 600.
 * 예정 = --border-interactive 원 + --text-muted 라벨.
 * 연결선 --border-subtle, 지나온 구간은 #1c1c1c.
 *
 * onStepClick을 넘기면 단계를 눌러 그 단계로 이동할 수 있다(cursor: pointer).
 * isStepEnabled로 지금 화면에 없는 단계는 누르지 못하게 막는다 — 후보도 없는데 다듬기로는 못 간다.
 */
export function Stepper({
  steps,
  current,
  onStepClick,
  isStepEnabled,
}: {
  steps: string[];
  current: number;
  onStepClick?: (index: number) => void;
  isStepEnabled?: (index: number) => boolean;
}) {
  return (
    <ol className="flex items-center gap-2">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        const clickable = Boolean(onStepClick) && (isStepEnabled?.(i) ?? true);
        const circle = (
          <span
            className={cn(
              "flex size-6 shrink-0 items-center justify-center rounded-full border text-badge tabular",
              done && "border-ink text-ink",
              active && "border-ink bg-ink text-on-dark shadow-inset",
              !done && !active && "border-line-strong text-muted",
            )}
            aria-hidden
          >
            {done ? <Check className="size-3" strokeWidth={2.5} /> : i + 1}
          </span>
        );
        const labelEl = (
          <span
            className={cn(
              "truncate text-sm",
              active ? "font-semibold text-ink" : done ? "text-ink" : "text-muted",
            )}
          >
            {label}
          </span>
        );
        return (
          <li key={label} className="flex min-w-0 flex-1 items-center gap-2 last:flex-none">
            {clickable ? (
              <button
                type="button"
                onClick={() => onStepClick?.(i)}
                aria-current={active ? "step" : undefined}
                className="flex shrink-0 cursor-pointer items-center gap-2 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40"
              >
                {circle}
                {labelEl}
              </button>
            ) : (
              <span className="flex shrink-0 items-center gap-2" aria-current={active ? "step" : undefined}>
                {circle}
                {labelEl}
              </span>
            )}
            {i < steps.length - 1 && (
              <span
                className={cn(
                  "hidden h-px min-w-4 flex-1 sm:block",
                  done ? "bg-ink" : "bg-line",
                )}
                aria-hidden
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
