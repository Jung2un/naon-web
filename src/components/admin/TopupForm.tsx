"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { topUpCredits } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { AdminUser } from "@/lib/admin/types";
type Payload = {
  user_id: string;
  request_id: string;
  credits: number;
  amount_krw: number;
  depositor: string;
  payment_reference: string;
  note: string;
};
const fmt = (n: number) => n.toLocaleString("ko-KR");
export function TopupForm({ user }: { user: AdminUser }) {
  const router = useRouter();
  const [open, setOpen] = useState(false),
    [payload, setPayload] = useState<Payload | null>(null);
  const [pending, setPending] = useState(false),
    [error, setError] = useState(""),
    [receipt, setReceipt] = useState("");
  const [attempted, setAttempted] = useState(false);
  const busy = useRef(false);
  function review(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPayload({
      user_id: user.id,
      request_id: crypto.randomUUID(),
      credits: Number(data.get("credits")),
      amount_krw: Number(data.get("amount_krw")),
      depositor: String(data.get("depositor")).trim(),
      payment_reference: String(data.get("payment_reference")).trim(),
      note: String(data.get("note")).trim(),
    });
    setError("");
    setAttempted(false);
  }
  async function confirm() {
    if (!payload || busy.current) return;
    busy.current = true;
    setPending(true);
    setAttempted(true);
    setError("");
    try {
      const result = await topUpCredits(payload);
      if (result.error || !result.data) {
        setError(
          result.error ||
            "결과를 확인하지 못했습니다. 같은 요청으로 다시 확인해 주세요.",
        );
        if (result.retryable === false) setAttempted(false);
        return;
      }
      setReceipt(
        `${user.email} 계정에 ${fmt(result.data.credits)}개를 충전했습니다. 처리 후 잔액 ${fmt(result.data.balance_after)}개.`,
      );
      setOpen(false);
      setPayload(null);
      router.refresh();
    } catch {
      setError(
        "연결이 끊겼습니다. 다시 확인하면 같은 요청을 중복 지급 없이 확인합니다.",
      );
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  return (
    <div>
      <Button
        variant="primary"
        onClick={() => {
          setOpen(true);
          setError("");
        }}
      >
        크레딧 충전
      </Button>
      {receipt && (
        <p role="status" className="mt-3 max-w-lg text-sm text-primary">
          {receipt}
        </p>
      )}
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!pending) setOpen(next);
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {payload
                ? "입금과 지급 내용을 확인하세요"
                : "무통장입금 크레딧 충전"}
            </DialogTitle>
            <DialogDescription>
              <span className="block break-all font-medium text-ink">
                {user.email}
              </span>
              <span className="text-sm">현재 잔액 {fmt(user.credits)}개</span>
            </DialogDescription>
          </DialogHeader>
          {!payload ? (
            <form onSubmit={review} className="mt-5 space-y-4">
              <label className="block text-sm">
                입금자명
                <Input
                  name="depositor"
                  required
                  maxLength={80}
                  className="mt-1"
                  placeholder="통장에 표시된 입금자명"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm">
                  입금액 (원)
                  <Input
                    name="amount_krw"
                    type="number"
                    required
                    min={1}
                    max={100000000}
                    step={1}
                    className="mt-1"
                  />
                </label>
                <label className="block text-sm">
                  지급 크레딧
                  <Input
                    name="credits"
                    type="number"
                    required
                    min={1}
                    max={100000}
                    step={1}
                    className="mt-1"
                  />
                </label>
              </div>
              <label className="block text-sm">
                입금 거래 식별번호
                <Input
                  name="payment_reference"
                  required
                  minLength={4}
                  maxLength={120}
                  className="mt-1"
                  placeholder="은행 거래번호 또는 입금일시-입금자-금액"
                />
                <span className="mt-1 block text-caption text-muted">
                  같은 입금에는 같은 번호를 입력하세요. 중복 충전을 막습니다.
                </span>
              </label>
              <label className="block text-sm">
                관리 메모 (선택)
                <Input
                  name="note"
                  maxLength={300}
                  className="mt-1"
                  placeholder="사용자에게 공개되지 않는 메모"
                />
              </label>
              <Button type="submit" variant="primary" className="w-full">
                충전 내용 확인
              </Button>
            </form>
          ) : (
            <div className="mt-5 space-y-4">
              <dl className="space-y-3 rounded-xl bg-sunken p-4 text-sm">
                {[
                  ["입금자", payload.depositor],
                  ["확인한 입금액", `${fmt(payload.amount_krw)}원`],
                  ["지급 크레딧", `${fmt(payload.credits)}개`],
                  ["입금 식별번호", payload.payment_reference],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4">
                    <dt className="shrink-0 text-muted">{label}</dt>
                    <dd className="break-all text-right font-semibold">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="flex items-start gap-2 text-sm text-muted">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
                실제 입금을 확인한 뒤 지급하세요. 처리자와 충전 내역이
                기록됩니다.
              </p>
              {error && (
                <p
                  role="alert"
                  className="rounded-xl bg-danger-bg p-3 text-sm text-danger"
                >
                  {error}
                </p>
              )}
              <div className="flex gap-2">
                {!attempted && (
                  <Button onClick={() => setPayload(null)} disabled={pending}>
                    다시 입력
                  </Button>
                )}
                <Button
                  className="flex-1"
                  variant="primary"
                  onClick={confirm}
                  disabled={pending}
                >
                  {pending
                    ? "처리 확인 중…"
                    : attempted
                      ? "같은 충전 요청 다시 확인"
                      : `${fmt(payload.credits)}개 지급하기`}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
