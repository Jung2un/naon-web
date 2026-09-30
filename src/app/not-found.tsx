import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  Film,
  Home,
  ScanLine,
  Sparkles,
  Users,
} from "lucide-react";
import { BrandMark } from "@/components/app/BrandMark";
import { NotFoundBackButton } from "@/components/app/NotFoundBackButton";

export const metadata: Metadata = {
  title: "페이지를 찾을 수 없어요",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[1120px] flex-col px-6 py-8 sm:px-10">
      <header className="flex items-center justify-between">
        <Link
          href="/dashboard"
          aria-label="홈으로 가기"
          className="inline-flex min-h-11 items-center gap-3"
        >
          <BrandMark size="sm" />
          <span className="text-sm font-semibold text-ink">나의 스튜디오</span>
        </Link>
        <span className="rounded-full border border-line px-3 py-1.5 text-[11px] font-semibold tracking-[0.12em] text-muted">
          PAGE NOT FOUND
        </span>
      </header>

      <section
        aria-labelledby="not-found-title"
        className="grid flex-1 items-center gap-8 py-10 sm:py-16 lg:grid-cols-[1fr_1.05fr] lg:gap-14"
      >
        <div className="order-2 lg:order-1">
          <p className="mb-4 text-[11px] font-semibold tracking-[0.18em] text-muted">
            잠깐, 길을 벗어났어요
          </p>
          <h1
            id="not-found-title"
            className="break-keep font-display text-[34px] font-semibold leading-[1.2] tracking-[-0.045em] text-ink sm:text-[46px]"
          >
            이 장면은
            <br />
            찾을 수 없어요.
          </h1>
          <p className="mt-5 break-keep text-sm leading-relaxed text-muted sm:text-base">
            주소가 바뀌었거나 페이지가 삭제되었을 수 있어요.
            <br className="hidden sm:block" /> 홈에서 만들던 이야기를 이어가
            볼까요?
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-on-dark transition-colors hover:bg-ink"
            >
              <Home className="size-4" aria-hidden />
              홈으로 돌아가기
            </Link>
            <NotFoundBackButton />
          </div>
        </div>

        <div
          aria-hidden
          className="relative order-1 flex h-[240px] items-center justify-center overflow-hidden rounded-[32px] bg-primary-soft sm:h-[340px] lg:order-2 lg:h-[420px]"
        >
          <div className="absolute size-[270px] rounded-full border border-line-strong/10 sm:size-[370px]" />
          <div className="absolute size-[190px] rounded-full border border-line-strong/10 sm:size-[270px]" />
          <span className="absolute -translate-y-2 font-display text-[150px] font-semibold leading-none tracking-[-0.07em] text-primary/15 sm:text-[220px]">
            404
          </span>
          <div className="relative flex h-36 w-44 rotate-[-8deg] flex-col justify-between rounded-[22px] border-[5px] border-surface bg-primary p-4 text-on-dark shadow-overlay transition-transform duration-500 motion-safe:hover:rotate-0 sm:h-44 sm:w-56">
            <div className="flex items-center gap-1.5">
              <span className="size-1 rounded-full bg-on-dark/50" />
              <span className="size-1 rounded-full bg-on-dark/50" />
              <span className="size-1 rounded-full bg-on-dark/50" />
            </div>
            <ScanLine className="mx-auto size-12 stroke-[1] text-on-dark/70 sm:size-16" />
            <p className="text-center text-[9px] tracking-[0.2em] text-on-dark/70">
              SCENE NOT FOUND
            </p>
          </div>
          <span className="absolute bottom-6 right-5 flex rotate-[5deg] items-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5 text-[11px] text-muted sm:bottom-10 sm:right-8">
            <Sparkles className="size-3.5" />
            새로운 장면은 홈에서
          </span>
        </div>
      </section>

      <footer className="border-t border-line pb-[env(safe-area-inset-bottom)] pt-6">
        <p className="mb-3 text-xs text-muted">찾던 곳으로 바로 이동하세요</p>
        <nav aria-label="주요 페이지" className="grid gap-3 sm:grid-cols-2">
          {[
            {
              href: "/characters",
              label: "내 캐릭터",
              description: "만들던 캐릭터 이어서 보기",
              icon: Users,
            },
            {
              href: "/jobs",
              label: "내 작업물",
              description: "완성된 영상과 진행 상황 확인",
              icon: Film,
            },
          ].map(({ href, label, description, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group flex min-h-20 items-center gap-3 rounded-[18px] border border-line bg-surface px-5 py-4 transition-colors hover:bg-primary-soft"
            >
              <Icon className="size-5 shrink-0 text-muted" aria-hidden />
              <span>
                <span className="block text-sm font-semibold">{label}</span>
                <span className="mt-1 block text-xs text-muted">
                  {description}
                </span>
              </span>
              <ArrowUpRight className="ml-auto size-4 text-muted" aria-hidden />
            </Link>
          ))}
        </nav>
      </footer>
    </main>
  );
}
