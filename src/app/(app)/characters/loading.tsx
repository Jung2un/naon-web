import { PageHeaderSkeleton, CardGridSkeleton } from "@/components/app/skeletons";

export default function Loading() {
  return (
    <>
      <PageHeaderSkeleton />
      <CardGridSkeleton count={4} ratio="aspect-[3/4]" />
    </>
  );
}
