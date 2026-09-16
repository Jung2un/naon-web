import type { Metadata } from "next";
import { Film } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { JobCard, JobGrid } from "@/components/app/JobCard";
import { EmptyState } from "@/components/app/EmptyState";
import { JobsRealtime } from "@/components/app/JobsRealtime";
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
          description="앱에서 10초짜리 영상을 찍으면 여기로 들어와요. 변환은 1~3분 걸려요."
          action={{ label: "캐릭터 보기", href: "/characters" }}
        />
      </>
    );
  }

  return (
    <>
      <JobsRealtime />
      <PageHeader
        title="작업물"
        description="앱에서 찍은 영상이 캐릭터 얼굴로 바뀐 결과예요."
      />
      <JobGrid>
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </JobGrid>
    </>
  );
}
