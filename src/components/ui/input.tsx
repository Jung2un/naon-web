import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * DESIGN.md §6 — 입력
 * 배경 --surface-sunken, 테두리 1px --border-subtle, 라운드 6px, 높이 40px, 글자 15px.
 * 포커스 시 테두리를 --border-interactive로 진하게 하고 --ring-subtle 3px 링을 붙인다.
 * 에러 시 테두리 --status-error-line, 아래에 13px --status-error 메시지.
 *
 * 새 색을 만들지 않는다 — 포커스 테두리도 아웃라인 버튼·선택 상태와 같은 토큰을 쓴다.
 * `ui/select.tsx`의 트리거가 이 규칙을 그대로 따른다.
 */
const fieldBase = [
  "w-full rounded-[6px] border border-line bg-sunken text-base text-ink",
  "placeholder:text-muted",
  "transition-[border-color,box-shadow] duration-150 ease-out",
  // 포커스 — 테두리가 차콜로 진해지고 같은 계열의 얇은 링이 붙는다.
  // 파란 기본 포커스 링 대신 드래그 선택과 같은 톤으로 맞춘다.
  "focus:border-line-strong focus:outline-none",
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
      className={cn(fieldBase, "h-10 px-3", className)}
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

/**
 * 선택은 `ui/select.tsx`에 따로 있다.
 * 네이티브 `<option>`은 OS가 그려서 디자인 시스템을 못 맞춘다.
 */

/** 에러 메시지 — 입력 아래 13px --status-error */
export function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="text-caption text-danger">{children}</p>;
}
