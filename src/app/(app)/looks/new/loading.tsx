import { PageHeaderSkeleton } from "@/components/app/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <>
      <PageHeaderSkeleton />
      <Skeleton className="h-10 w-full max-w-[420px] rounded-[6px]" />
      {Array.from({ length: 4 }, (_, s) => (
        <div key={s} className="mt-8">
          <Skeleton className="h-[15px] w-12" />
          <div className="mt-3 grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i}>
                <Skeleton className="aspect-square w-full rounded-[12px]" />
                <Skeleton className="mt-2 h-[19px] w-2/3" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
