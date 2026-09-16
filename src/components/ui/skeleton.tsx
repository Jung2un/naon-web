import { cn } from "@/lib/utils";

/** 로딩 중에는 같은 치수의 스켈레톤. --overlay-faint 배경, 1.4s 펄스. — DESIGN.md §6 */
export function Skeleton({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("skeleton rounded-[6px]", className)}
      aria-hidden
      {...props}
    />
  );
}
