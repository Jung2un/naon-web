"use client";
import { useState } from "react";
import { saveBillingSettings } from "@/app/admin/actions";
import type { BillingSettings } from "@/lib/admin/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
export function BillingSettingsForm({ initial }: { initial: BillingSettings }) {
  const [value, setValue] = useState(initial),
    [pending, setPending] = useState(false),
    [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const update = (key: keyof BillingSettings, next: string | boolean) =>
    setValue((v) => ({ ...v, [key]: next }));
  async function save(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    setMessage("");
    try {
      const result = await saveBillingSettings(value);
      if (result.error) setError(result.error);
      else
        setMessage(
          value.enabled
            ? "저장했습니다. 사용자에게 요금제와 입금 계좌가 표시됩니다."
            : "저장했습니다. 사용자에게는 충전 준비 중으로 표시됩니다.",
        );
    } catch {
      setError("저장하지 못했습니다. 연결을 확인한 뒤 다시 시도해 주세요.");
    } finally {
      setPending(false);
    }
  }
  return (
    <form onSubmit={save} className="max-w-4xl space-y-6">
      <fieldset disabled={pending} className="space-y-6 disabled:opacity-60">
        <section className="rounded-2xl border border-line bg-surface p-6">
          <h2 className="font-semibold">입금 계좌</h2>
          <p className="mt-1 text-sm text-muted">
            공개하면 로그인한 사용자에게 표시되는 계좌입니다.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {(
              [
                ["bank_name", "은행명", 40],
                ["account_number", "계좌번호", 60],
                ["account_holder", "예금주", 80],
              ] as const
            ).map(([key, label, max]) => (
              <label key={key} className="text-sm">
                {label}
                <Input
                  value={value[key]}
                  onChange={(e) => update(key, e.target.value)}
                  maxLength={max}
                  required={value.enabled}
                  className="mt-2"
                />
              </label>
            ))}
          </div>
          <label className="mt-5 block text-sm">
            입금·확인 안내
            <textarea
              className="mt-2 min-h-28 w-full rounded-xl border border-line bg-cream p-3 text-base"
              value={value.instructions}
              onChange={(e) => update("instructions", e.target.value)}
              maxLength={1000}
              placeholder="입금자명에 사용할 정보, 확인 시간, 문의 방법 등을 적어주세요."
            />
          </label>
        </section>
        <section className="rounded-2xl border border-line bg-surface p-6">
          <h2 className="font-semibold">크레딧 요금제</h2>
          <p className="mt-1 text-sm text-muted">
            사용자에게 안내할 최종 입금액을 입력하세요. 최대 6개까지 등록할 수
            있습니다.
          </p>
          <div className="mt-5 space-y-4">
            {value.plans.map((plan, i) => (
              <div
                key={i}
                className="grid items-end gap-3 rounded-xl bg-cream p-4 sm:grid-cols-[1fr_1fr_1fr_auto]"
              >
                {(
                  [
                    ["name", "요금제 이름"],
                    ["credits", "크레딧 수량"],
                    ["price_krw", "입금액 (원)"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="text-sm">
                    {label}
                    <Input
                      className="mt-2"
                      type={key === "name" ? "text" : "number"}
                      value={plan[key]}
                      required
                      min={key === "name" ? undefined : 1}
                      max={
                        key === "credits"
                          ? 100000
                          : key === "price_krw"
                            ? 100000000
                            : undefined
                      }
                      maxLength={key === "name" ? 40 : undefined}
                      step={1}
                      onChange={(e) =>
                        setValue((v) => ({
                          ...v,
                          plans: v.plans.map((p, index) =>
                            index === i
                              ? {
                                  ...p,
                                  [key]:
                                    key === "name"
                                      ? e.target.value
                                      : Number(e.target.value),
                                }
                              : p,
                          ),
                        }))
                      }
                    />
                  </label>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  aria-label={`${plan.name || i + 1} 요금제 삭제`}
                  onClick={() =>
                    setValue((v) => ({
                      ...v,
                      plans: v.plans.filter((_, index) => index !== i),
                    }))
                  }
                >
                  삭제
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            className="mt-4"
            disabled={value.plans.length >= 6}
            onClick={() =>
              setValue((v) => ({
                ...v,
                plans: [...v.plans, { name: "", credits: 1, price_krw: 1 }],
              }))
            }
          >
            + 요금제 추가
          </Button>
        </section>
        <label className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-5">
          <input
            type="checkbox"
            checked={value.enabled}
            onChange={(e) => update("enabled", e.target.checked)}
            className="size-5 accent-primary"
          />
          <span>
            <span className="block font-semibold">충전 안내 공개</span>
            <span className="text-sm text-muted">
              계좌와 요금제가 준비되면 켜주세요. 꺼두면 충전 준비 중으로
              표시됩니다.
            </span>
          </span>
        </label>
        <Button variant="primary" type="submit">
          {pending ? "저장 중…" : "설정 저장"}
        </Button>
      </fieldset>
      {message && (
        <p role="status" className="text-sm text-primary">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </form>
  );
}
