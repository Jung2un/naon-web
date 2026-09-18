import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";
import { Film } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { JobCard, JobGrid } from "@/components/app/JobCard";
import { EmptyState } from "@/components/app/EmptyState";
import { getJobs } from "@/lib/data/queries";

export const metadata: Metadata = { title: "작업물" };

export default async function JobsPage() {
  const jobs = await getJobs();

  if (jobs.length === 0) {
    return (
      <>
        <PageHeader title="작업물" />
        <EmptyState
          icon={Film}
          title="아직 작업물이 없어요"
          description="영상을 올리고 캐릭터를 고르면, 완성된 영상을 여기서 볼 수 있어요."
          action={{ label: "영상 변환하기", href: "/jobs/new" }}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="작업물"
        description="캐릭터로 바꾼 영상과 진행 중인 작업을 확인해요."
        action={<Button variant="primary" asChild><Link href="/jobs/new">영상 변환하기</Link></Button>}
      />
      <JobGrid>
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </JobGrid>
    </>
  );
}
