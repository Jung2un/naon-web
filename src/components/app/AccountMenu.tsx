import Link from "next/link";
import { ArrowUpRight, LogOut, ShieldCheck } from "lucide-react";

/** 사이드바와 모바일 더보기의 계정 메뉴. 운영 관리 링크는 관리자에게만 보인다. */
export function AccountMenu({ isAdmin = false }: { isAdmin?: boolean }) {
  return (
    <div className="space-y-1 border-t border-line pt-3">
      {isAdmin && (
        <Link
          href="/admin"
          className="group flex min-h-12 items-center gap-3 rounded-2xl px-3 py-2 text-sm text-primary transition-colors hover:bg-primary-soft"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-primary-soft group-hover:bg-surface">
            <ShieldCheck className="size-4" strokeWidth={1.75} aria-hidden />
          </span>
          운영 관리
          <ArrowUpRight className="ml-auto size-3.5 text-muted" aria-hidden />
        </Link>
      )}
      <form action="/auth/signout" method="post">
        <button
          type="submit"
          className="flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-2xl px-3 py-2 text-sm text-muted transition-colors duration-150 ease-out hover:bg-hover hover:text-ink"
        >
          <span className="flex size-8 shrink-0 items-center justify-center">
            <LogOut className="size-4" strokeWidth={1.75} aria-hidden />
          </span>
          로그아웃
        </button>
      </form>
    </div>
  );
}
