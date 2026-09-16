import {
  PageHeaderSkeleton,
  CreditStripSkeleton,
  TableSkeleton,
} from "@/components/app/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <>
      <PageHeaderSkeleton />
      <CreditStripSkeleton />
      <div className="mt-10">
        <Skeleton className="mb-4 h-[25px] w-24" />
        <TableSkeleton />
      </div>
    </>
  );
}
