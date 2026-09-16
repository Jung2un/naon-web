import {
  PageHeaderSkeleton,
  CreditStripSkeleton,
  CardGridSkeleton,
} from "@/components/app/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <>
      <PageHeaderSkeleton />
      <CreditStripSkeleton />
      <div className="mt-10">
        <Skeleton className="mb-4 h-[25px] w-28" />
        <CardGridSkeleton />
      </div>
    </>
  );
}
