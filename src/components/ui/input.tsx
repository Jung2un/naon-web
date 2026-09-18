import * as React from "react";
import { cn } from "@/lib/utils";


const fieldBase = [
  "w-full rounded-[12px] border border-line bg-surface text-[16px] text-ink",
  "placeholder:text-muted",
  "transition-[border-color,box-shadow] duration-150 ease-out",
  // 포커스 — 테두리가 차콜로 진해지고 같은 계열의 얇은 링이 붙는다.
  // 파란 기본 포커스 링 대신 드래그 선택과 같은 톤으로 맞춘다.
  "focus:border-primary focus:outline-none",
  "focus:shadow-[0_0_0_3px_var(--color-ring-subtle)]",
  // 에러는 포커스보다 우선한다
  "aria-invalid:border-danger-line aria-invalid:focus:border-danger-line",
  "disabled:cursor-not-allowed disabled:opacity-50",
];

export function Input({
  className,
  invalid,
  ...props
}: React.ComponentProps<"input"> & { invalid?: boolean }) {
  return (
    <input
      data-slot="input"
      aria-invalid={invalid || undefined}
      className={cn(fieldBase, "h-12 px-4", className)}
      {...props}
    />
  );
}

export function Textarea({
  className,
  invalid,
  ...props
}: React.ComponentProps<"textarea"> & { invalid?: boolean }) {
  return (
    <textarea
      data-slot="textarea"
      aria-invalid={invalid || undefined}
      className={cn(fieldBase, "min-h-24 px-3 py-2", className)}
      {...props}
    />
  );
}




export function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="text-caption text-danger">{children}</p>;
}
