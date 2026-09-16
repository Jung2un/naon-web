import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * DESIGN.md §6 — Stepper
 * 가로 3단계. 완료 = 차콜 테두리 원 + 체크. 현재 = 차콜로 채운 원 + 라벨 600.
 * 예정 = --border-interactive 원 + --text-muted 라벨.
 * 연결선 --border-subtle, 지나온 구간은 #1c1c1c.
 */
export function Stepper({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <ol className="flex items-center gap-2">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex min-w-0 flex-1 items-center gap-2 last:flex-none">
            <span className="flex shrink-0 items-center gap-2">
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
              <span
                className={cn(
                  "truncate text-sm",
                  active ? "font-semibold text-ink" : done ? "text-ink" : "text-muted",
                )}
              >
                {label}
              </span>
            </span>
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
