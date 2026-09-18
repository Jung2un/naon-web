import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";


const buttonVariants = cva(
  [
    "relative inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "text-sm font-semibold transition-[background-color,border-color,box-shadow,opacity] duration-150 ease-out",
    "active:opacity-80 disabled:pointer-events-none disabled:opacity-40",
    "[&_svg]:size-4 [&_svg]:shrink-0",
    // 터치 대상 최소 44×44px — 시각 높이가 작아도 투명 영역으로 채운다
    "before:absolute before:left-0 before:top-1/2 before:h-11 before:w-full before:-translate-y-1/2 before:content-['']",
  ],
  {
    variants: {
      variant: {
        primary: "bg-primary text-white shadow-inset hover:bg-primary/90",
        outline:
          "border border-line bg-surface text-ink hover:bg-hover",
        ghost: "bg-transparent text-ink hover:bg-hover",
        destructive:
          "border border-danger-line bg-transparent text-danger hover:bg-danger-bg",
      },
      size: {
        default: "h-12 rounded-[12px] px-4 py-2",
        sm: "h-11 rounded-[10px] px-3",
        lg: "h-13 rounded-[14px] px-5 text-base",
        icon: "size-11 rounded-full px-0 before:w-11 before:-left-1",
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
