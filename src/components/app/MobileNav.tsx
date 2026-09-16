"use client";

import { useState } from "react";
import Link from "next/link";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import { SidebarNav } from "./Sidebar";

/** 1024px 미만에서는 상단 바 + 햄버거 시트로 바뀐다. — DESIGN.md §6 */
export function MobileNav({ footer }: { footer?: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-cream px-4 lg:hidden">
      <Link href="/dashboard" className="font-display text-card font-semibold text-ink">
        AI 대역
      </Link>

      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <DialogPrimitive.Trigger
          aria-label="메뉴 열기"
          className="flex size-11 items-center justify-center rounded-full text-ink transition-colors duration-150 ease-out hover:bg-hover"
        >
          <Menu className="size-5" strokeWidth={1.75} />
        </DialogPrimitive.Trigger>

        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-scrim" />
          <DialogPrimitive.Content className="fixed inset-y-0 left-0 z-50 flex w-[280px] max-w-[85vw] flex-col border-r border-line bg-cream px-3 py-5 shadow-overlay duration-200 ease-out">
            <DialogPrimitive.Title className="mb-6 px-3 font-display text-card font-semibold text-ink">
              AI 대역
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only">
              주 메뉴
            </DialogPrimitive.Description>
            <DialogPrimitive.Close
              aria-label="메뉴 닫기"
              className="absolute right-3 top-4 flex size-9 items-center justify-center rounded-full text-muted transition-colors duration-150 ease-out hover:bg-hover hover:text-ink"
            >
              <X className="size-4" />
            </DialogPrimitive.Close>
            <SidebarNav onNavigate={() => setOpen(false)} />
            <div className="mt-auto">{footer}</div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </header>
  );
}
