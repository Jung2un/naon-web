import type { Metadata } from "next";
import Link from "next/link";
import { Film } from "lucide-react";
import { PageHeader, SectionHeader } from "@/components/app/PageHeader";
import { CreditStrip } from "@/components/app/CreditStrip";
import { JobCard, JobGrid } from "@/components/app/JobCard";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/button";
import { getCharacters, getJobs, getProfile } from "@/lib/data/queries";

import { StudioGuide } from "@/components/app/StudioGuide";

export const metadata: Metadata = { title: "홈" };

export default async function DashboardPage() {
  const [profile, characters, jobs] = await Promise.all([
    getProfile(),
    getCharacters(),
    getJobs({ limit: 8 }),
  ]);

  return (
    <>
      {/* 앱바에는 인사말 대신 화면 이름을 띄운다 — 하단 탭의 "홈"과 같은 말로 맞춘다 */}
      <PageHeader
        title={profile?.display_name ? `${profile.display_name}님, 반가워요` : "나만의 스튜디오에 오신 걸 환영해요"}
        shortTitle="홈"
        description="오늘은 어떤 모습으로 표현해 볼까요?"
      />

      <StudioGuide hasCharacter={characters.some(c => c.stage === "ready" && c.status === "done")} />
      <div className="mt-6"><CreditStrip balance={profile?.credits ?? 0} /></div>

      <section className="mt-10">
        <SectionHeader
          title="최근 작업물"
          action={
            jobs.length > 0 ? (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/jobs">전체 보기</Link>
              </Button>
            ) : undefined
          }
        />

        {jobs.length === 0 ? (
          <EmptyState
            icon={Film}
            title="아직 작업물이 없어요"
            description="앱에서 10초짜리 영상을 찍으면 여기에 나타나요. 변환은 1~3분 걸려요."
            action={{ label: "캐릭터 보기", href: "/characters" }}
          />
        ) : (
          <JobGrid>
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </JobGrid>
        )}
      </section>
    </>
  );
}
