"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav-items";

/**
 * DESIGN.md §6 — 사이드바
 * 폭 240px, 크림 배경, 오른쪽 1px solid --border-subtle.
 * 활성 = --hover-subtle 배경 + --text-primary. 비활성 = --text-muted.
 * 활성 표시에 채도 있는 색이나 왼쪽 강조 바를 쓰지 않는다.
 */
export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5" aria-label="주 메뉴">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              // 터치 대상 최소 44px — DESIGN.md §6
              "flex min-h-11 items-center gap-2.5 rounded-[6px] px-3 py-2 text-sm transition-colors duration-150 ease-out",
              active
                ? "bg-hover text-ink"
                : "text-muted hover:bg-hover hover:text-ink",
            )}
          >
            <Icon className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar({ footer }: { footer?: React.ReactNode }) {
  return (
    <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-line bg-cream px-3 py-5 lg:flex">
      <Link
        href="/dashboard"
        className="mb-6 block px-3 font-display text-card font-semibold text-ink"
      >
        AI 대역
      </Link>
      <SidebarNav />
      <div className="mt-auto">{footer}</div>
    </aside>
  );
}
