"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";

/** Elapsed time is measured; duration is an estimate, never a fabricated AI percentage. */
export function GenerationProgress({ title, startedAt, expectedSeconds = 180, completed, total, background = true, note }: {
  title: string; startedAt: string; expectedSeconds?: number; completed?: number; total?: number; background?: boolean;
  /** 이 작업만의 안내 한 줄. 예: 영상 변환은 최소 15분. 제목 바로 아래, 경과 시간 위에 선다. */
  note?: string;
}) {
  const router = useRouter();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const clock = setInterval(() => setNow(Date.now()), 1000);
    // Realtime can disconnect. Only mounted while work is active; refreshing never retries AI.
    const poll = setInterval(() => { if (!document.hidden) router.refresh(); }, 15000);
    return () => { clearInterval(clock); clearInterval(poll); };
  }, [router]);
  const start = Date.parse(startedAt);
  const elapsed = now === null || !Number.isFinite(start) ? 0 : Math.max(0, Math.floor((now - start) / 1000));
  const remaining = Math.max(0, expectedSeconds - elapsed);
  return <section className="mt-5 rounded-[16px] border border-line bg-surface p-5" aria-label="생성 진행 상태">
    <p className="flex items-center gap-2 font-semibold"><LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />{title}</p>
    {note && <p className="mt-2 text-sm text-body">{note}</p>}
    {total !== undefined && completed !== undefined && <div className="mt-3">
      <p className="text-sm">이미지 {total}장 중 {completed}장 저장 완료</p>
      <progress className="mt-2 h-2 w-full accent-primary" value={completed} max={total} aria-label="저장 완료 이미지" />
    </div>}
    <p className="mt-3 text-sm tabular">경과 {Math.floor(elapsed / 60)}분 {elapsed % 60}초</p>
    <p className="mt-1 text-sm text-muted">{remaining > 0
      ? `남은 시간 약 ${Math.ceil(remaining / 60)}분 · 전체 예상 ${Math.ceil(expectedSeconds / 60)}분 이상`
      : "예상보다 오래 걸리고 있어요. 대기열과 처리 상태를 계속 확인하고 있어요."}</p>
    <p className="mt-2 text-caption text-muted">예상 시간은 대기열과 통신 상태에 따라 달라져요. {background ? "실제 AI 진행률은 제공되지 않아요. 창을 닫아도 접수된 작업은 계속 진행돼요." : "접수가 끝날 때까지 이 화면을 유지해 주세요."}</p>
  </section>;
}
