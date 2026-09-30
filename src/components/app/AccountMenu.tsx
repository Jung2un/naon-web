import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { LogOut } from "lucide-react";

/**
 * 사이드바 하단(모바일은 더보기 시트 하단). 관리자에게는 운영 관리 링크, 모든 사용자에게는 로그아웃을 둔다.
 * 이름·크레딧 줄은 뺐다 — 크레딧은 모바일 상단·크레딧 화면에서 이미 보인다.
 */
export function AccountMenu({ isAdmin = false }: { isAdmin?: boolean }) {
  return (
    <div className="border-t border-line pt-3">
      <>
        {isAdmin && (
          <Link
            href="/admin"
            className="mb-2 flex min-h-11 items-center gap-2.5 rounded-xl px-3 text-sm text-primary hover:bg-hover"
          >
            <ShieldCheck className="size-4" aria-hidden />
            운영 관리
          </Link>
        )}
      </>
      <form action="/auth/signout" method="post">
        <button
          type="submit"
          className="flex w-full items-center gap-2.5 min-h-11 rounded-[6px] px-3 py-2 text-sm text-muted transition-colors duration-150 ease-out hover:bg-hover hover:text-ink"
        >
          <LogOut className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
          로그아웃
        </button>
      </form>
    </div>
  );
}
