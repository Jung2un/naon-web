"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * DESIGN.md §6 — 선택 (입력 계열)
 *
 * 네이티브 `<option>`은 OS가 그려서 CSS가 거의 안 먹는다. 크림 배경·6px 라운드·
 * 차콜 하이라이트를 맞추려면 리스트박스를 직접 그려야 한다.
 *
 * 트리거는 입력과 완전히 같은 규칙(높이 40px, 배경 --surface-sunken, 라운드 6px,
 * 포커스 시 차콜 테두리 + --ring-subtle 링).
 * 펼친 목록은 떠 있는 층이라 --shadow-overlay를 쓴다 — 다이얼로그와 같은 이유다.
 * 선택 표시는 채도 있는 색 없이 차콜 체크로만 한다.
 */

export type SelectItem = {
  value: string;
  label: string;
  disabled?: boolean;
};

export function Select({
  items,
  value,
  defaultValue,
  onValueChange,
  placeholder = "고르기",
  id,
  disabled,
  invalid,
  className,
  "aria-labelledby": ariaLabelledBy,
}: {
  items: SelectItem[];
  value?: string;
  /** 서버 컴포넌트에서 상태 없이 쓸 때. */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
  "aria-labelledby"?: string;
}) {
  return (
    <SelectPrimitive.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <SelectPrimitive.Trigger
        id={id}
        aria-invalid={invalid || undefined}
        aria-labelledby={ariaLabelledBy}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-[6px]",
          "border border-line bg-sunken px-3 text-base text-ink",
          "transition-[border-color,box-shadow] duration-150 ease-out",
          // 입력과 같은 포커스 — 드래그 선택과 같은 차콜 톤
          "focus:border-line-strong focus:outline-none",
          "focus:shadow-[0_0_0_3px_var(--color-ring-subtle)]",
          "data-[state=open]:border-line-strong",
          "aria-invalid:border-danger-line aria-invalid:focus:border-danger-line",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "[&>span]:min-w-0 [&>span]:truncate",
          className,
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon asChild>
          <ChevronDown
            className="size-4 shrink-0 text-muted"
            strokeWidth={1.75}
            aria-hidden
          />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={4}
          className={cn(
            "z-50 max-h-[min(320px,var(--radix-select-content-available-height))]",
            "w-[var(--radix-select-trigger-width)] overflow-hidden",
            "rounded-[8px] border border-line bg-cream shadow-overlay",
          )}
        >
          <SelectPrimitive.ScrollUpButton className="flex h-6 items-center justify-center text-muted">
            <ChevronUp className="size-4" strokeWidth={1.75} aria-hidden />
          </SelectPrimitive.ScrollUpButton>

          <SelectPrimitive.Viewport className="p-1">
            {items.map((item) => (
              <SelectPrimitive.Item
                key={item.value}
                value={item.value}
                disabled={item.disabled}
                className={cn(
                  "relative flex cursor-default select-none items-center gap-2",
                  "rounded-[6px] py-2 pl-3 pr-8 text-sm text-body outline-none",
                  "transition-colors duration-150 ease-out",
                  // 하이라이트는 네비·호버와 같은 --hover-subtle
                  "data-[highlighted]:bg-hover data-[highlighted]:text-ink",
                  "data-[state=checked]:text-ink",
                  "data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
                )}
              >
                <SelectPrimitive.ItemText>{item.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="absolute right-3 flex items-center">
                  <Check className="size-4 text-ink" strokeWidth={2} aria-hidden />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>

          <SelectPrimitive.ScrollDownButton className="flex h-6 items-center justify-center text-muted">
            <ChevronDown className="size-4" strokeWidth={1.75} aria-hidden />
          </SelectPrimitive.ScrollDownButton>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
