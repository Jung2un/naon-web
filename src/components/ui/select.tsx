"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";



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
          "flex h-12 w-full items-center justify-between gap-2 rounded-[12px]",
          "border border-line bg-surface px-3 text-[16px] text-ink",
          "transition-[border-color,box-shadow] duration-150 ease-out",
          // 입력과 같은 포커스 — 드래그 선택과 같은 차콜 톤
          "focus:border-primary focus:outline-none",
          "focus:shadow-[0_0_0_3px_var(--color-ring-subtle)]",
          "data-[state=open]:border-primary",
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
                  "rounded-[12px] py-2 pl-3 pr-8 text-sm text-body outline-none",
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
