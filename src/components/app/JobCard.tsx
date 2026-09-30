import Link from "next/link";
import { JobThumbnail } from "./JobThumbnail";
import { DeleteItemButton } from "./DeleteItemButton";
import { StatusBadge } from "./StatusBadge";
import { relativeTime } from "@/lib/format";
import type { JobListItem } from "@/types/models";

/**
 * DESIGN.md §6 — JobCard
 * 9:16 썸네일. 영상 썸네일이 없으면 캐릭터 대표 이미지 또는 상태 안내를 보여준다.
 * StatusBadge를 썸네일 좌상단에 8px 안쪽으로 절대 배치.
 * 아래: 캐릭터 이름 14px/400, 상대 시각 13px --text-muted.
 */
export function JobCard({ job }: { job: JobListItem }) {
  return (
    <article className="rounded-[20px] border border-line bg-surface p-2">
      <Link
        href={`/jobs/${job.id}`}
        className="group block rounded-[12px] focus-visible:outline-offset-4"
      >
        <div className="relative aspect-[9/16] overflow-hidden rounded-[12px] border border-line bg-sunken transition-colors duration-150 ease-out group-hover:border-line-strong">
          <JobThumbnail
            key={job.thumbnail_url}
            src={job.thumbnail_url}
            isFallback={job.thumbnail_is_fallback ?? false}
            status={job.status}
          />
          <span className="absolute left-2 top-2">
            <StatusBadge status={job.status} />
          </span>
        </div>
        <p className="mt-2 truncate text-sm text-ink">{job.character_name}</p>
        <p className="text-caption text-muted">
          {relativeTime(job.created_at)}
        </p>
      </Link>
      <div className="mt-2 flex justify-end border-t border-line pt-1">
        <DeleteItemButton
          kind="job"
          id={job.id}
          name={job.character_name}
          busy={job.status === "queued" || job.status === "processing"}
        />
      </div>
    </article>
  );
}

/** 데스크톱 4열 / 태블릿 3열 / 모바일 2열, 간격 16px. */
export function JobGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {children}
    </div>
  );
}
