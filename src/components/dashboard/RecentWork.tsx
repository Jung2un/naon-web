"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Film } from "lucide-react";
import { JobThumbnail } from "@/components/app/JobThumbnail";
import { StatusBadge } from "@/components/app/StatusBadge";
import { DeleteItemButton } from "@/components/app/DeleteItemButton";
import { relativeTime } from "@/lib/format";
import type { JobListItem } from "@/types/models";

const working = (job: JobListItem) =>
  job.status === "processing" || job.status === "queued";

export function RecentWork({
  jobs,
  activeJobs,
  hasCharacter,
}: {
  jobs: JobListItem[];
  activeJobs: number;
  hasCharacter: boolean;
}) {
  const [filter, setFilter] = useState("all");
  const filters = [
    { id: "all", label: "전체", count: jobs.length },
    { id: "working", label: "만드는 중", count: jobs.filter(working).length },
    {
      id: "done",
      label: "완료",
      count: jobs.filter((j) => j.status === "done").length,
    },
    {
      id: "failed",
      label: "확인 필요",
      count: jobs.filter((j) => j.status === "failed").length,
    },
  ];
  const visible = jobs.filter(
    (j) =>
      filter === "all" ||
      (filter === "working" ? working(j) : j.status === filter),
  );
  return (
    <section id="recent-work" className="mt-10 scroll-mt-40">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.16em] text-muted">
            RECENT WORK
          </p>
          <h2 className="mt-1.5 text-2xl font-semibold tracking-[-0.035em]">
            내가 만든, 새로운 장면들
          </h2>
          <p className="mt-2 text-sm text-muted">
            {activeJobs
              ? `지금 ${activeJobs}개의 영상을 만들고 있어요. 완성되면 여기서 확인하세요.`
              : jobs.length
                ? "최근 작업을 확인하고, 다음 아이디어를 이어가세요."
                : "첫 영상을 만들면 이곳에 차곡차곡 모여요."}
          </p>
        </div>
        <Link
          href="/jobs"
          className="inline-flex min-h-11 items-center gap-2 text-sm text-muted hover:text-ink"
        >
          작업물 전체 보기
          <ArrowUpRight className="size-4" aria-hidden />
        </Link>
      </header>
      <div className="my-5 flex flex-wrap items-center justify-between gap-3">
        <div
          role="group"
          aria-label="최근 작업 상태 필터"
          className="flex flex-wrap gap-1"
        >
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-caption transition-colors ${filter === f.id ? "bg-primary text-on-dark" : "text-muted hover:bg-primary-soft"}`}
            >
              {f.label}
              <span className="opacity-60">{f.count}</span>
            </button>
          ))}
        </div>
        <span className="text-xs text-muted">최근 {jobs.length}개 작업</span>
      </div>
      <div aria-live="polite" className="sr-only">
        {filters.find((f) => f.id === filter)?.label} 작업 {visible.length}개
      </div>
      {visible.length ? (
        <div className="overflow-hidden rounded-[20px] border border-line bg-surface">
          {visible.map((job) => (
            <article
              key={job.id}
              className="group grid grid-cols-[72px_minmax(0,1fr)_44px] items-center gap-x-3 gap-y-1 border-b border-line px-3 py-4 last:border-0 sm:flex sm:gap-4 sm:px-5"
            >
              <Link
                href={`/jobs/${job.id}`}
                aria-label={`${job.character_name} 작업 보기`}
                className="relative row-span-2 block h-16 w-[72px] shrink-0 overflow-hidden rounded-xl bg-sunken sm:w-24"
              >
                <JobThumbnail
                  key={job.thumbnail_url}
                  src={job.thumbnail_url}
                  isFallback={job.thumbnail_is_fallback ?? false}
                  status={job.status}
                  compact
                />
              </Link>
              <Link href={`/jobs/${job.id}`} className="min-w-0 sm:flex-1">
                <p className="truncate text-sm font-semibold text-ink">
                  {job.character_name}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {relativeTime(job.created_at)}
                </p>
              </Link>
              <StatusBadge
                status={job.status}
                className="col-start-2 row-start-2 w-fit shrink-0 whitespace-nowrap"
              />
              <Link
                href={`/jobs/${job.id}`}
                aria-label={`${job.character_name} 작업 상세`}
                className="hidden size-11 shrink-0 items-center justify-center rounded-full hover:bg-primary-soft sm:flex"
              >
                <ArrowUpRight className="size-4" aria-hidden />
              </Link>
              <div className="col-start-3 row-span-2 row-start-1">
                <DeleteItemButton
                  kind="job"
                  id={job.id}
                  name={job.character_name}
                  busy={working(job)}
                  iconOnly
                />
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="flex min-h-56 flex-col items-center justify-center rounded-[20px] border border-dashed border-line bg-surface/60 px-6 py-10 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary-soft">
            <Film className="size-5 text-muted" aria-hidden />
          </span>
          <h3 className="mt-4 text-lg font-semibold">
            {jobs.length
              ? "이 상태의 최근 작업은 없어요"
              : "첫 번째 장면이 기다리고 있어요"}
          </h3>
          <p className="mt-2 text-sm text-muted">
            {jobs.length
              ? "다른 상태를 선택해 작업을 확인해 보세요."
              : "캐릭터를 완성하고 내 영상에 새로운 모습을 입혀보세요."}
          </p>
          {jobs.length ? (
            <button
              type="button"
              onClick={() => setFilter("all")}
              className="mt-4 min-h-11 rounded-full bg-primary-soft px-5 text-sm"
            >
              전체 작업 보기
            </button>
          ) : (
            <Link
              href={hasCharacter ? "/jobs/new" : "/characters/new"}
              className="mt-5 inline-flex min-h-12 items-center gap-3 rounded-full bg-primary px-5 text-sm font-semibold text-on-dark"
            >
              {hasCharacter ? "첫 영상 만들기" : "첫 캐릭터 만들기"}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
