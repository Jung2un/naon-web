import Link from "next/link";
import { ArrowUpRight, ShieldCheck } from "lucide-react";

export function AdminShortcut() {
  return (
    <section
      aria-label="관리자 바로가기"
      className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-[20px] border border-line bg-surface p-5 sm:px-6"
    >
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft">
          <ShieldCheck className="size-5 text-primary" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-semibold">관리자 페이지</p>
          <p className="mt-1 text-caption text-muted">
            사용자 확인부터 크레딧 충전, 운영 현황까지
          </p>
        </div>
      </div>
      <Link
        href="/admin"
        className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-on-dark hover:bg-ink"
      >
        관리자 페이지 열기
        <ArrowUpRight className="size-4" aria-hidden />
      </Link>
    </section>
  );
}
