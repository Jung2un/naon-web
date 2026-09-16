"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { MoreHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRIMARY_NAV_ITEMS, SECONDARY_NAV_ITEMS } from "./nav-items";

/**
 * 모바일 하단 탭 — 1024px 미만에서만 선다.
 *
 * 햄버거 시트를 대신한다. 시트는 어디를 가든 "우상단까지 손을 뻗어 열고 → 고르고 → 닫기"
 * 세 동작이 들고, 그동안 지금 어디에 있는지도 안 보인다.
 * 탭은 엄지 자리에서 한 번에 끝나고 현재 위치가 늘 보인다.
 *
 * 활성 표시는 사이드바와 같은 규칙이다 — 채도 있는 색이나 강조 바를 쓰지 않고
 * 차콜/뮤티드 대비와 웨이트로만 구분한다. — DESIGN.md §6
 */
export function BottomNav({ footer }: { footer?: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const moreActive = SECONDARY_NAV_ITEMS.some(
    ({ href }) => pathname === href || pathname.startsWith(`${href}/`),
  );

  return (
    <nav
      aria-label="주 메뉴"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-cream pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="flex items-stretch">
        {PRIMARY_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-14 flex-col items-center justify-center gap-1 transition-colors duration-150 ease-out",
                  active ? "text-ink" : "text-muted",
                )}
              >
                <Icon
                  className="size-5 shrink-0"
                  strokeWidth={active ? 2 : 1.75}
                  aria-hidden
                />
                <span className={cn("text-badge", active && "font-semibold")}>
                  {label}
                </span>
              </Link>
            </li>
          );
        })}

        <li className="flex-1">
          <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
            <DialogPrimitive.Trigger
              className={cn(
                "flex h-14 w-full cursor-pointer flex-col items-center justify-center gap-1 transition-colors duration-150 ease-out",
                moreActive ? "text-ink" : "text-muted",
              )}
            >
              <MoreHorizontal
                className="size-5 shrink-0"
                strokeWidth={moreActive ? 2 : 1.75}
                aria-hidden
              />
              <span className={cn("text-badge", moreActive && "font-semibold")}>
                더보기
              </span>
            </DialogPrimitive.Trigger>

            <DialogPrimitive.Portal>
              <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-scrim" />
              {/* 하단에서 올라오는 시트. 손이 닿는 쪽에서 열리고 닫힌다. */}
              <DialogPrimitive.Content className="fixed inset-x-0 bottom-0 z-50 rounded-t-[16px] border-t border-line bg-cream px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-5 shadow-overlay duration-200 ease-out">
                <DialogPrimitive.Title className="px-3 font-display text-section font-semibold text-ink">
                  더보기
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="sr-only">
                  크레딧과 설정, 계정 메뉴
                </DialogPrimitive.Description>
                <DialogPrimitive.Close
                  aria-label="닫기"
                  className="absolute right-3 top-4 flex size-11 cursor-pointer items-center justify-center rounded-full text-muted transition-colors duration-150 ease-out hover:bg-hover hover:text-ink"
                >
                  <X className="size-4" />
                </DialogPrimitive.Close>

                <div className="mt-4 flex flex-col gap-0.5">
                  {SECONDARY_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                    const active =
                      pathname === href || pathname.startsWith(`${href}/`);
                    return (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex min-h-11 items-center gap-2.5 rounded-[6px] px-3 py-2.5 text-base transition-colors duration-150 ease-out",
                          active
                            ? "bg-hover text-ink"
                            : "text-muted hover:bg-hover hover:text-ink",
                        )}
                      >
                        <Icon
                          className="size-4 shrink-0"
                          strokeWidth={1.75}
                          aria-hidden
                        />
                        {label}
                      </Link>
                    );
                  })}
                </div>

                <div className="mt-3">{footer}</div>
              </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
          </DialogPrimitive.Root>
        </li>
      </ul>
    </nav>
  );
}
