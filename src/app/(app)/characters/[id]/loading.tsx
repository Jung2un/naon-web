import { PageHeaderSkeleton, CardGridSkeleton } from "@/components/app/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <>
      <PageHeaderSkeleton />
      <Skeleton className="h-[22px] w-20 rounded-full" />
      <div className="mt-8 grid grid-cols-5 gap-4">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="aspect-[3/4] w-full rounded-[12px]" />
        ))}
      </div>
      <div className="mt-10">
        <Skeleton className="mb-4 h-[25px] w-16" />
        <CardGridSkeleton count={4} ratio="aspect-[3/4]" />
      </div>
    </>
  );
}
