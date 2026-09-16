import Link from "next/link";
import { LogOut } from "lucide-react";
import { credits as fmt } from "@/lib/format";

/** 사이드바 하단. 잔량은 세로로 정렬되는 숫자라 tabular-nums. */
export function AccountMenu({
  name,
  credits,
}: {
  name: string;
  credits: number;
}) {
  return (
    <div className="border-t border-line pt-3">
      <Link
        href="/credits"
        className="flex items-center justify-between min-h-11 rounded-[6px] px-3 py-2 transition-colors duration-150 ease-out hover:bg-hover"
      >
        <span className="min-w-0 truncate text-sm text-ink">{name}</span>
        <span className="ml-2 shrink-0 text-caption tabular text-muted">
          {fmt(credits)}
        </span>
      </Link>

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
