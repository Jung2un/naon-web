import { LogOut } from "lucide-react";

/**
 * 사이드바 하단(모바일은 더보기 시트 하단). 로그아웃만 둔다.
 * 이름·크레딧 줄은 뺐다 — 크레딧은 모바일 상단·크레딧 화면에서 이미 보인다.
 */
export function AccountMenu() {
  return (
    <div className="border-t border-line pt-3">
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
