import { Skeleton } from "@/components/ui/skeleton";

export function PageHeaderSkeleton() {
  return (
    <div className="mb-6">
      <Skeleton className="h-[34px] w-56" />
      <Skeleton className="mt-3 h-[23px] w-72" />
    </div>
  );
}

export function CreditStripSkeleton() {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[12px] border border-line bg-cream p-5">
      <div>
        <Skeleton className="h-[19px] w-20" />
        <Skeleton className="mt-2 h-9 w-24" />
      </div>
      <Skeleton className="h-10 w-28 rounded-[6px]" />
    </div>
  );
}

/** 9:16 카드 그리드. 실제 그리드와 같은 치수라 레이아웃이 튀지 않는다. */
export function CardGridSkeleton({
  count = 8,
  ratio = "aspect-[9/16]",
}: {
  count?: number;
  ratio?: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>
          <Skeleton className={`w-full rounded-[12px] ${ratio}`} />
          <Skeleton className="mt-2 h-[21px] w-2/3" />
          <Skeleton className="mt-1 h-[19px] w-1/3" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="rounded-[12px] border border-line bg-cream p-5">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-line py-3 last:border-0">
          <Skeleton className="h-[21px] w-32" />
          <Skeleton className="h-[21px] w-24" />
          <Skeleton className="ml-auto h-[21px] w-12" />
        </div>
      ))}
    </div>
  );
}
