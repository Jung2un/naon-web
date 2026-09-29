"use client";

import { MicroLabel } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  ADJUSTMENT_GROUPS,
  ADJUSTMENT_RANGE,
  type AdjustmentKey,
  type Adjustments,
} from "@/types/models";

/**
 * 얼굴 세부 조정 슬라이더. -2 ~ +2 다섯 칸, 가운데가 "그대로". — docs/기획서.md §3
 *
 * 값은 정수만 오간다 — 자유 프롬프트가 아니다. 문장은 서버(_shared/prompt.ts)가 만든다.
 * 색은 새로 만들지 않는다. 트랙은 sunken, 손잡이는 primary(차콜)다.
 */
export function AdjustmentSlider({
  id,
  label,
  low,
  high,
  value,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  low: string;
  high: string;
  value: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-sm text-body">
          {label}
        </label>
        <span className="text-caption tabular text-muted" aria-hidden>
          {value > 0 ? `+${value}` : value === 0 ? "그대로" : value}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={-ADJUSTMENT_RANGE}
        max={ADJUSTMENT_RANGE}
        step={1}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuetext={value === 0 ? "그대로" : value > 0 ? `${high} ${value}` : `${low} ${-value}`}
        className={cn(
          "mt-2 h-11 w-full cursor-pointer appearance-none bg-transparent disabled:cursor-default disabled:opacity-40",
          // 트랙
          "[&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-sunken",
          "[&::-moz-range-track]:h-1 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-sunken",
          // 손잡이 — 터치 대상 22px, 시각은 차콜 원
          "[&::-webkit-slider-thumb]:-mt-[9px] [&::-webkit-slider-thumb]:size-[22px] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-surface [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-focus",
          "[&::-moz-range-thumb]:size-[22px] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-surface [&::-moz-range-thumb]:bg-primary",
          "focus-visible:outline-none [&:focus-visible::-webkit-slider-thumb]:ring-2 [&:focus-visible::-webkit-slider-thumb]:ring-ring-subtle",
        )}
      />
      <div className="flex justify-between text-[11px] leading-none text-muted" aria-hidden>
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  );
}

/** 머리색 · 눈 · 코 · 눈썹 묶음 전부. 순서와 문구는 models.ts의 ADJUSTMENT_GROUPS다. */
export function AdjustmentPanel({
  value,
  disabled,
  onChange,
}: {
  value: Adjustments;
  disabled?: boolean;
  onChange: (key: AdjustmentKey, next: number) => void;
}) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {ADJUSTMENT_GROUPS.map((group) => (
        <div key={group.title} className="rounded-[12px] border border-line bg-surface p-4">
          <MicroLabel>{group.title}</MicroLabel>
          <div className="mt-3 flex flex-col gap-4">
            {group.items.map((item) => (
              <AdjustmentSlider
                key={item.key}
                id={`adjust-${item.key}`}
                label={item.label}
                low={item.low}
                high={item.high}
                value={value[item.key] ?? 0}
                disabled={disabled}
                onChange={(next) => onChange(item.key, next)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
