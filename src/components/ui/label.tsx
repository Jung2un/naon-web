import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "@/lib/utils";

export function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      className={cn("text-sm font-normal text-ink", className)}
      {...props}
    />
  );
}

/** 11px 대문자 라벨. 자간을 늘리는 유일한 예외다. — DESIGN.md §3 */
export function MicroLabel({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      className={cn("text-label uppercase text-muted", className)}
      {...props}
    />
  );
}
