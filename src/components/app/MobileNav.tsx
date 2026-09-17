import Link from "next/link";
import { credits as fmt } from "@/lib/format";

import { BrandMark } from "./BrandMark";
/**
 * 모바일 상단 바 — 1024px 미만. 이동은 하단 탭이 맡는다(BottomNav).
 *
 * 여기 남긴 건 둘뿐이다. 지금 어느 서비스인지(로고)와, 무엇을 누르든 따라다니는
 * 제약인 크레딧 잔량. 잔량은 "가는 곳"이 아니라 "보는 값"이라 탭이 아니라 이 자리가 맞다.
 * 누르면 충전 화면으로 간다.
 */
export function MobileNav({ credits }: { credits: number }) {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-cream px-4 lg:hidden">
      <Link
        href="/dashboard"
        aria-label="대시보드로 가기"
        className="flex h-11 items-center"
      >
        <BrandMark size="sm" />
      </Link>

      <Link
        href="/credits"
        className="flex h-9 items-center gap-1.5 rounded-full border border-line px-3 transition-colors duration-150 ease-out hover:bg-hover"
      >
        <span className="text-caption text-muted">크레딧</span>
        <span className="text-sm tabular text-ink">{fmt(credits)}</span>
      </Link>
    </header>
  );
}
