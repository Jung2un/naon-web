import type { Metadata } from "next";
import Link from "next/link";
import { NotFoundBackButton } from "@/components/app/NotFoundBackButton";

export const metadata: Metadata = {
  title: "페이지를 찾을 수 없어요",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-6 py-12">
      <div className="w-full max-w-[520px] text-center">
        <h1 className="break-keep font-display text-[28px] font-semibold leading-tight tracking-[-0.035em] text-ink sm:text-[36px]">
          페이지를 찾을 수 없어요
        </h1>
        <p className="mt-4 break-keep text-sm leading-relaxed text-muted sm:text-base">
          주소를 확인하거나 홈으로 이동해 주세요.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-on-dark transition-colors hover:bg-ink"
          >
            홈으로 돌아가기
          </Link>
          <NotFoundBackButton />
        </div>
      </div>
    </main>
  );
}
