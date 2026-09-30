"use client";
import { useState } from "react";
import { Check, Copy, Landmark, Coins, Clock3 } from "lucide-react";
import type { BillingSettings } from "@/lib/admin/types";
import { Button } from "@/components/ui/button";
export function CreditPlans({
  settings,
}: {
  settings: BillingSettings | null;
}) {
  const [selected, setSelected] = useState<number | null>(null),
    [copied, setCopied] = useState(false),
    [copyError, setCopyError] = useState("");
  if (!settings?.enabled || !settings.plans.length)
    return (
      <section
        id="charge"
        className="mt-8 rounded-[24px] border border-line bg-surface p-8 text-center"
      >
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary-soft">
          <Landmark className="size-6" aria-hidden />
        </span>
        <h2 className="mt-4 text-xl font-semibold">
          크레딧 충전을 준비하고 있어요
        </h2>
        <p className="mt-2 text-sm text-muted">
          요금제와 입금 계좌가 준비되면 이곳에서 안내해 드릴게요.
          <br />
          보유한 크레딧은 지금도 사용할 수 있어요.
        </p>
      </section>
    );
  const plan = selected === null ? null : settings.plans[selected];
  async function copy() {
    try {
      await navigator.clipboard.writeText(settings!.account_number);
      setCopied(true);
      setCopyError("");
    } catch {
      setCopyError("계좌번호를 길게 누르거나 선택해서 복사해 주세요.");
    }
  }
  return (
    <section id="charge" className="mt-10 scroll-mt-6">
      <div className="mb-6">
        <p className="text-xs tracking-widest text-muted">CREDITS</p>
        <h2 className="mt-2 text-2xl font-semibold break-keep">
          필요한 만큼, 가볍게 충전하세요
        </h2>
        <p className="mt-2 text-sm text-muted">
          요금제를 선택하고 계좌로 입금하면, 확인 후 크레딧을 넣어드려요.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {settings.plans.map((p, i) => (
          <button
            key={`${p.name}-${i}`}
            type="button"
            aria-pressed={selected === i}
            onClick={() => {
              setSelected(i);
              setCopied(false);
            }}
            className={`relative rounded-[20px] border p-6 text-left transition-[border-color,background-color,transform] duration-150 motion-reduce:transition-none motion-safe:hover:-translate-y-0.5 ${selected === i ? "border-primary bg-primary-soft ring-1 ring-primary" : "border-line bg-surface hover:border-line-strong"}`}
          >
            <span className="text-sm text-muted">{p.name}</span>
            <span className="mt-4 block text-3xl font-semibold tabular-nums">
              {p.credits.toLocaleString()}
              <span className="ml-1 text-sm font-normal">크레딧</span>
            </span>
            <span className="mt-5 flex items-center justify-between">
              <span className="font-semibold tabular-nums">
                {p.price_krw.toLocaleString()}원
              </span>
              <span
                className={`flex size-7 items-center justify-center rounded-full ${selected === i ? "bg-primary text-on-dark" : "border border-line"}`}
              >
                {selected === i && <Check className="size-4" aria-hidden />}
              </span>
            </span>
          </button>
        ))}
      </div>
      <div className="mt-6 overflow-hidden rounded-[24px] border border-line bg-surface">
        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-2">
          <div>
            <div className="flex items-center gap-2">
              <Landmark className="size-5" aria-hidden />
              <h3 className="font-semibold">입금 계좌 안내</h3>
            </div>
            <p className="mt-5 text-sm text-muted">
              {settings.bank_name} · 예금주 {settings.account_holder}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <p className="select-all break-all text-xl font-semibold tabular-nums">
                {settings.account_number}
              </p>
              <Button size="sm" onClick={copy}>
                {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
                {copied ? "복사 완료" : "계좌 복사"}
              </Button>
            </div>
            <p role="status" className="mt-2 text-caption text-muted">
              {copyError || (copied ? "계좌번호를 복사했어요." : "")}
            </p>
          </div>
          <div aria-live="polite" className="rounded-2xl bg-cream p-5">
            <p className="text-sm text-muted">
              {plan
                ? `${plan.name} · ${plan.credits.toLocaleString()}크레딧`
                : "위에서 요금제를 선택해 주세요"}
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {plan
                ? `${plan.price_krw.toLocaleString()}원 입금`
                : "입금할 금액을 확인하세요"}
            </p>
            <p className="mt-3 flex gap-2 text-caption text-muted">
              <Clock3 className="size-4 shrink-0" aria-hidden />
              입금 확인 후 수동으로 충전됩니다. 즉시 반영되지 않을 수 있어요.
            </p>
          </div>
        </div>
        <div className="border-t border-line bg-cream px-6 py-5 sm:px-8">
          <ol className="grid gap-3 text-sm sm:grid-cols-3">
            {[
              "요금제와 금액 확인",
              "안내된 계좌로 입금",
              "운영자 확인 후 충전 완료",
            ].map((s, i) => (
              <li key={s} className="flex items-center gap-2">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>
          {settings.instructions && (
            <p className="mt-5 whitespace-pre-wrap break-words text-sm text-body">
              {settings.instructions}
            </p>
          )}
        </div>
      </div>
      <p className="mt-4 flex items-center gap-2 text-caption text-muted">
        <Coins className="size-4" aria-hidden />
        충전이 완료되면 위 잔액과 아래 사용 내역에서 확인할 수 있어요.
      </p>
    </section>
  );
}
