"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav-items";

import { BrandMark } from "./BrandMark";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-2" aria-label="주 메뉴">
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
              "flex min-h-11 items-center gap-2.5 rounded-[12px] px-4 py-3 text-sm transition-colors duration-150 ease-out",
              active
                ? "bg-primary-soft font-semibold text-primary"
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
    <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-line bg-surface px-4 py-8 lg:flex">
      <Link
        href="/dashboard"
        aria-label="대시보드로 가기"
        className="mb-10 flex h-8 items-center px-3"
      >
        <BrandMark size="sm" />
      </Link>
      <p className="mb-3 px-4 text-caption text-muted">나의 스튜디오</p>
      <SidebarNav />
      <div className="mt-8 rounded-[16px] bg-primary-soft p-4">
        <p className="font-semibold text-ink">새로운 나를 만들어 볼까요?</p>
        <p className="mt-2 text-caption text-muted">원하는 분위기를 고르고 나만의 캐릭터를 완성해요.</p>
        <Link href="/characters/new" className="mt-3 inline-flex min-h-11 items-center font-semibold text-primary">캐릭터 만들기 →</Link>
      </div>
      <div className="mt-auto">{footer}</div>
    </aside>
  );
}
