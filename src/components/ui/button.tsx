import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * DESIGN.md §6 — 버튼
 * 공통: 라운드 6px, 패딩 8px 16px, 글자 14px/400, active 시 opacity 0.8.
 * Primary의 inset shadow는 이 디자인 시스템의 시그니처라 빼지 않는다.
 * 사각 버튼에 9999px 라운드를 쓰지 않는다.
 */
const buttonVariants = cva(
  [
    "relative inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "text-sm font-normal transition-[background-color,border-color,box-shadow,opacity] duration-150 ease-out",
    "active:opacity-80 disabled:pointer-events-none disabled:opacity-40",
    "[&_svg]:size-4 [&_svg]:shrink-0",
    // 터치 대상 최소 44×44px — 시각 높이가 작아도 투명 영역으로 채운다
    "before:absolute before:left-0 before:top-1/2 before:h-11 before:w-full before:-translate-y-1/2 before:content-['']",
  ],
  {
    variants: {
      variant: {
        primary: "bg-ink text-on-dark shadow-inset hover:bg-ink/92",
        outline:
          "border border-line-strong bg-transparent text-ink hover:bg-hover",
        ghost: "bg-transparent text-ink hover:bg-hover",
        destructive:
          "border border-danger-line bg-transparent text-danger hover:bg-danger-bg",
      },
      size: {
        default: "h-10 rounded-[6px] px-4 py-2",
        sm: "h-8 rounded-[6px] px-3",
        lg: "h-12 rounded-[6px] px-5 text-base",
        icon: "size-9 rounded-full px-0 before:w-11 before:-left-1",
      },
    },
    defaultVariants: { variant: "outline", size: "default" },
  },
);

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { buttonVariants };
