import { Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_LABEL, type JobStatus } from "@/types/models";


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
        status === "queued" && "bg-sunken text-muted",
        status === "processing" && "bg-primary-soft text-primary",
        status === "done" && "bg-success-soft text-success",
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
