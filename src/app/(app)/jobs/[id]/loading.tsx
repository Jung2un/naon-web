import { PageHeaderSkeleton } from "@/components/app/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <>
      <PageHeaderSkeleton />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="mx-auto w-full max-w-[420px]">
          <Skeleton className="aspect-[9/16] max-h-[70vh] w-full rounded-[12px]" />
        </div>
        <div>
          <Skeleton className="h-[22px] w-20 rounded-full" />
          <Skeleton className="mt-6 h-64 w-full rounded-[12px]" />
        </div>
      </div>
    </>
  );
}
