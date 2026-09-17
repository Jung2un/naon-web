import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * 심볼(The Shift). 이름이나 이니셜을 담지 않는다 — 서비스 이름이 정해지지 않아서
 * 화면에도 이름을 붙이지 않고 심볼만 쓴다. 이름이 정해지면 여기 옆에 글자로 더한다. — docs/로고-가이드.md
 * 화면 안에서는 차콜 심볼만 쓴다. 코발트는 파비콘처럼 아주 작은 자리 전용이다.
 * 늘이거나 돌리거나 외곽선·그림자를 넣지 않는다.
 *
 * 그림 자체는 꾸밈이다(alt=""). 링크로 감쌀 때는 링크에 aria-label을 단다.
 */
const SYMBOL = { src: "/brand/symbol.png", width: 90, height: 120 };

export function BrandMark({
  size = "md",
  className,
}: {
  /** sm = 앱 셸(사이드바·모바일 상단), lg = 로그인 첫 화면 */
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const height = { sm: 22, md: 28, lg: 40 }[size];
  const width = Math.round((height * SYMBOL.width) / SYMBOL.height);

  return (
    <Image
      src={SYMBOL.src}
      alt=""
      width={width}
      height={height}
      priority
      className={cn("block", className)}
    />
  );
}
