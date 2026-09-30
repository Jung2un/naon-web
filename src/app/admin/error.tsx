"use client";
import { Button } from "@/components/ui/button";
export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-8">
      <h2 className="text-xl font-semibold">관리 정보를 불러오지 못했어요</h2>
      <p className="my-4 text-muted">
        연결 상태를 확인하고 다시 시도해 주세요. 충전 결과가 불확실하면 같은
        충전 요청으로 다시 확인하세요.
      </p>
      <Button onClick={reset}>다시 불러오기</Button>
    </div>
  );
}
