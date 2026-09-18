import { Check } from "lucide-react";
import { cn } from "@/lib/utils";


export const stepAnchor = (index: number) => `step-${index}`;


export function scrollToStep(index: number) {
  document.getElementById(stepAnchor(index))?.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    block: "start",
  });
}


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
              done && "border-primary text-primary",
              active && "border-primary bg-primary text-white shadow-inset",
              !done && !active && "border-line-strong text-muted",
            )}
            aria-hidden
          >
            {done ? <Check className="size-3" strokeWidth={2.5} /> : i + 1}
          </span>
        );
        // 모바일(640px 미만)은 네 단계 글자가 한 줄에 안 들어간다. 지금 단계만 글자를 보여주고
        // 나머지는 번호만 둔다. 숨긴 글자는 sr-only라 스크린리더에는 그대로 읽힌다.
        const labelEl = (
          <span
            className={cn(
              "truncate text-sm",
              active ? "font-semibold text-ink" : done ? "text-ink" : "text-muted",
              !active && "sr-only sm:not-sr-only",
            )}
          >
            {label}
          </span>
        );
        return (
          // 모바일은 flex-auto — 칸마다 자기 내용만큼 먼저 차지하고 남은 폭을 선이 똑같이 나눈다.
          // flex-1이면 지금 단계 글자가 있는 첫 칸만 선이 짧아진다(16px vs 66px). 데스크톱은 예전 그대로.
          <li
            key={label}
            className="flex min-w-0 flex-auto items-center gap-2 last:flex-none sm:flex-1"
          >
            {clickable ? (
              <button
                type="button"
                onClick={() => onStepClick?.(i)}
                aria-current={active ? "step" : undefined}
                className="flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40"
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
              // 연결선은 모바일에서도 보인다 — 글자를 줄인 자리를 채우고 단계 흐름을 보여준다
              <span
                className={cn(
                  "block h-px min-w-4 flex-1",
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
