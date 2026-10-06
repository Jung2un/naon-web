import Image from "next/image";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";

/** Existing Shift symbol paired with the accessible Naon wordmark. */
const SYMBOL = { src: "/brand/symbol.png", width: 90, height: 120 };

export function BrandMark({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const height = { sm: 22, md: 28, lg: 40 }[size];
  const width = Math.round((height * SYMBOL.width) / SYMBOL.height);
  const textSize = { sm: "text-xl", md: "text-2xl", lg: "text-4xl" }[size];
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-2.5 text-ink", className)}>
      <Image src={SYMBOL.src} alt="" width={width} height={height} priority />
      <span className={cn("font-semibold leading-none tracking-[-0.06em]", textSize)}>
        {BRAND.name}
      </span>
    </span>
  );
}
