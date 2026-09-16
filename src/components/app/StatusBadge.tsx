import { Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_LABEL, type JobStatus } from "@/types/models";

/**
 * DESIGN.md §4 — 상태 표현
 * 색만으로 구분하지 않는다. 형태를 같이 쓴다.
 * 크림 배경 위에서 유일하게 튀는 색이 실패여야 눈이 거기로 간다.
 * 치수: 높이 22px, 좌우 패딩 8px, 아이콘-글자 5px, 글자 12px/400, 라운드 9999px.
 */
export function StatusBadge({
  status,
  className,
}: {
  status: JobStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center gap-[5px] rounded-full px-2 text-badge font-normal",
        status === "queued" && "border border-line-strong text-body",
        status === "processing" && "border border-line-strong text-body",
        status === "done" && "bg-ink text-on-dark shadow-inset",
        status === "failed" && "border border-danger-line bg-danger-bg text-danger",
        className,
      )}
    >
      <StatusIcon status={status} />
      {STATUS_LABEL[status]}
    </span>
  );
}

function StatusIcon({ status }: { status: JobStatus }) {
  switch (status) {
    case "queued":
      // 빈 원
      return (
        <span
          className="size-[9px] rounded-full border border-current"
          aria-hidden
        />
      );
    case "processing":
      // 회전하는 링. reduced-motion에서는 투명도 펄스로 바뀐다 (globals.css)
      return (
        <span
          data-motion="keep"
          className="motion-spin size-[9px] rounded-full border border-current border-t-transparent"
          aria-hidden
        />
      );
    case "done":
      return <Check className="size-3" strokeWidth={2.25} aria-hidden />;
    case "failed":
      return <AlertCircle className="size-3" strokeWidth={2.25} aria-hidden />;
  }
}
