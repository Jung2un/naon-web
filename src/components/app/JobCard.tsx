import Link from "next/link";
import Image from "next/image";
import { StatusBadge } from "./StatusBadge";
import { relativeTime } from "@/lib/format";
import type { JobListItem } from "@/types/models";

/**
 * DESIGN.md §6 — JobCard
 * 9:16 썸네일, 라운드 12px, 1px solid --border-subtle, 배경 #1c1c1c(레터박스).
 * StatusBadge를 썸네일 좌상단에 8px 안쪽으로 절대 배치.
 * 아래: 캐릭터 이름 14px/400, 상대 시각 13px --text-muted.
 */
export function JobCard({ job }: { job: JobListItem }) {
  return (
    <Link
      href={`/jobs/${job.id}`}
      className="group block rounded-[12px] focus-visible:outline-offset-4"
    >
      <div className="relative aspect-[9/16] overflow-hidden rounded-[12px] border border-line bg-ink transition-colors duration-150 ease-out group-hover:border-line-strong">
        {job.thumbnail_url ? (
          <Image
            src={job.thumbnail_url}
            alt=""
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
            className="object-cover"
          />
        ) : null}
        <span className="absolute left-2 top-2">
          <StatusBadge status={job.status} />
        </span>
      </div>
      <p className="mt-2 truncate text-sm text-ink">{job.character_name}</p>
      <p className="text-caption text-muted">{relativeTime(job.created_at)}</p>
    </Link>
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
