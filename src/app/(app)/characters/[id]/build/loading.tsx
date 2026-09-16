import { PageHeaderSkeleton } from "@/components/app/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <>
      <PageHeaderSkeleton />
      <Skeleton className="h-6 w-full max-w-[520px] rounded-full" />
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="aspect-[3/4] w-full rounded-[12px]" />
        ))}
      </div>
    </>
  );
}
