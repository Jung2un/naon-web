"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRIMARY_NAV_ITEMS, SECONDARY_NAV_ITEMS } from "./nav-items";
import { BrandMark } from "./BrandMark";

const navGroups = [
  { label: "작업 공간", items: PRIMARY_NAV_ITEMS },
  { label: "내 계정", items: SECONDARY_NAV_ITEMS },
];

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-6" aria-label="주 메뉴">
      {navGroups.map(({ label: groupLabel, items }) => (
        <div key={groupLabel}>
          <p className="mb-2 px-3 text-[11px] font-semibold tracking-wide text-muted">
            {groupLabel}
          </p>
          <div className="flex flex-col gap-1">
            {items.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex min-h-12 items-center gap-3 rounded-2xl px-3 py-2 text-sm transition-colors duration-150 ease-out",
                    active
                      ? "bg-primary-soft font-semibold text-ink"
                      : "text-muted hover:bg-hover hover:text-ink",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-[10px] transition-colors",
                      active
                        ? "bg-primary text-on-dark"
                        : "bg-sunken/70 group-hover:bg-primary-soft",
                    )}
                  >
                    <Icon className="size-4" strokeWidth={1.75} aria-hidden />
                  </span>
                  {label}
                  {active && (
                    <span className="ml-auto mr-1 size-1.5 rounded-full bg-primary" aria-hidden />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function Sidebar({ footer }: { footer?: React.ReactNode }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col overflow-y-auto border-r border-line bg-surface px-4 py-6 lg:flex">
      <Link
        href="/dashboard"
        aria-label="대시보드로 가기"
        className="mb-8 flex min-h-12 shrink-0 items-center gap-3 rounded-2xl px-3"
      >
        <BrandMark size="md" />
        <span className="border-l border-line pl-3">
          <span className="block font-display text-[9px] font-semibold tracking-[0.15em] text-muted">
            PERSONAL STUDIO
          </span>
          <span className="mt-1 block text-sm font-semibold tracking-tight text-ink">
            나의 스튜디오
          </span>
        </span>
      </Link>
      <SidebarNav />
      <Link
        href="/characters/new"
        className="group relative my-7 block shrink-0 overflow-hidden rounded-[22px] bg-primary p-5 text-on-dark transition-colors hover:bg-ink"
      >
        <div className="mb-4 flex items-center justify-between">
          <span className="font-display text-[10px] font-semibold tracking-[0.15em] text-on-dark/65">
            MAKE IT YOURS
          </span>
          <Plus className="size-4 text-on-dark/65" strokeWidth={1.5} aria-hidden />
        </div>
        <p className="text-[19px] font-semibold leading-snug tracking-[-0.04em]">
          다음엔 어떤 나를<br />만나볼까요?
        </p>
        <div className="mt-5 flex items-center justify-between gap-2">
          <span className="text-caption font-semibold">캐릭터 만들기</span>
          <span className="flex size-8 items-center justify-center rounded-full border border-on-dark/20 motion-safe:transition-transform motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:translate-x-0.5">
            <ArrowUpRight className="size-4" aria-hidden />
          </span>
        </div>
      </Link>
      <div className="mt-auto shrink-0">{footer}</div>
    </aside>
  );
}
