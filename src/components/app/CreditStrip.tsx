import Link from "next/link";
import { Button } from "@/components/ui/button";
import { credits } from "@/lib/format";

/**
 * DESIGN.md §6 — CreditStrip
 * 카드(크림 + 테두리 + 12px), 패딩 20px.
 * 잔량은 36px/600 tabular-nums. 라벨은 13px --text-muted.
 * 잔량이 3 미만이면 충전 버튼을 Primary로 승격한다.
 */
const LOW_BALANCE = 3;

export function CreditStrip({ balance }: { balance: number }) {
  const isLow = balance < LOW_BALANCE;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-[12px] border border-line bg-cream p-5">
      <div>
        <p className="text-caption text-muted">남은 크레딧</p>
        <p className="mt-1 font-display text-metric font-semibold tabular text-ink">
          {credits(balance)}
        </p>
        {isLow && (
          <p className="mt-2 text-caption text-muted">
            {balance === 0
              ? "크레딧이 없어요. 충전하면 바로 변환할 수 있어요."
              : "곧 떨어져요. 미리 충전해 두면 끊기지 않아요."}
          </p>
        )}
      </div>
      <Button variant={isLow ? "primary" : "outline"} asChild>
        <Link href="/credits">크레딧 충전</Link>
      </Button>
    </div>
  );
}
