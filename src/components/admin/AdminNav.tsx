"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, ReceiptText, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
const items = [
  { href: "/admin", label: "대시보드", icon: LayoutDashboard },
  { href: "/admin/users", label: "사용자", icon: Users },
  { href: "/admin/topups", label: "충전 기록", icon: ReceiptText },
  { href: "/admin/settings", label: "요금제·계좌", icon: Settings2 },
];
export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="관리자 메뉴"
      className="flex gap-2 overflow-x-auto py-3 lg:flex-col"
    >
      {items.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/admin" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-11 shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm",
              active
                ? "bg-primary text-on-dark font-semibold"
                : "text-muted hover:bg-hover",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
