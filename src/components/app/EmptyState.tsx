import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * DESIGN.md §6 — EmptyState
 * 가운데 정렬, 최대 폭 420px, 위아래 여백 56px.
 * 72px 원 안에 40px lucide 아이콘. 버튼은 정확히 하나.
 * 빈 상태는 나중이 아니라 처음에 만든다. 신규 사용자가 보는 첫 화면이 항상 이것이다.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="mx-auto flex max-w-[420px] flex-col items-center py-14 text-center">
      <div className="flex size-[72px] items-center justify-center rounded-full bg-primary-soft">
        <Icon className="size-9 text-primary" strokeWidth={1.25} aria-hidden />
      </div>
      <h2 className="mt-5 font-display text-section font-semibold text-ink">
        {title}
      </h2>
      <p className="mt-2 text-base text-muted">{description}</p>
      {action && (
        <Button variant="primary" asChild className="mt-6">
          <Link href={action.href}>{action.label}</Link>
        </Button>
      )}
    </div>
  );
}
