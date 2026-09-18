import type { Metadata } from "next";
import Link from "next/link";
import { Users, Film } from "lucide-react";
import { PageHeader, SectionHeader } from "@/components/app/PageHeader";
import { CreditStrip } from "@/components/app/CreditStrip";
import { JobCard, JobGrid } from "@/components/app/JobCard";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/button";
import { getCharacters, getJobs, getProfile } from "@/lib/data/queries";

export const metadata: Metadata = { title: "대시보드" };

export default async function DashboardPage() {
  const [profile, characters, jobs] = await Promise.all([
    getProfile(),
    getCharacters(),
    getJobs({ limit: 8 }),
  ]);

  // 신규 유저가 보는 첫 화면은 항상 비어 있다. — CLAUDE.md 작업 방식
  if (characters.length === 0) {
    return (
      <>
        <PageHeader title="대시보드" />
        <EmptyState
          icon={Users}
          title="아직 캐릭터가 없어요"
          description="톤을 골라 캐릭터를 만들면, 앱에서 찍은 영상을 그 얼굴로 바꿀 수 있어요."
          action={{ label: "캐릭터 만들기", href: "/characters/new" }}
        />
      </>
    );
  }

  return (
    <>
      {/* 앱바에는 인사말 대신 화면 이름을 띄운다 — 하단 탭의 "홈"과 같은 말로 맞춘다 */}
      <PageHeader
        title={`안녕하세요, ${profile?.display_name ?? "반가워요"}`}
        shortTitle="홈"
        description="앱에서 찍은 영상이 여기로 들어와요."
      />

      <CreditStrip balance={profile?.credits ?? 0} />

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
