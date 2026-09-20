import { GenerationProgress } from "@/components/app/GenerationProgress";
import { RetryVideoJob } from "@/components/app/RetryVideoJob";
import { LOOKS_ENABLED } from "@/features/looks/config";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusBadge } from "@/components/app/StatusBadge";
import { JobsRealtime } from "@/components/app/JobsRealtime";
import { Button } from "@/components/ui/button";
import { getJob } from "@/lib/data/queries";
import { humanError } from "@/lib/errors";
import { credits, duration, fullTime } from "@/lib/format";

export async function generateMetadata({
  params,
}: PageProps<"/jobs/[id]">): Promise<Metadata> {
  const { id } = await params;
  const job = await getJob(id);
  return { title: job ? `${job.character_name} 작업물` : "작업물" };
}

export default async function JobDetailPage({ params }: PageProps<"/jobs/[id]">) {
  const { id } = await params;
  const job = await getJob(id);
  if (!job) notFound();

  return (
    <>
      <JobsRealtime jobId={job.id} />
      <PageHeader
        title={job.character_name}
        back={{ href: "/jobs", label: "작업물" }}
        action={
          job.status === "done" && job.result_video_url ? (
            <Button variant="primary" asChild>
              <a href={job.result_video_url} download>
                영상 내려받기
              </a>
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          {/* 9:16 영상 플레이어는 max-height 70vh — 세로 영상이 화면을 다 먹지 않게 */}
          <div className="mx-auto w-full max-w-[420px]">
            <div className="relative aspect-[9/16] max-h-[70vh] overflow-hidden rounded-[12px] border border-line bg-ink">
              {job.status === "done" && job.result_video_url ? (
                <video
                  src={job.result_video_url}
                  controls
                  playsInline
                  className="size-full object-contain"
                />
              ) : (
                <div className="flex size-full items-center justify-center">
                  <StatusBadge status={job.status} />
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-3">
            <StatusBadge status={job.status} />
          </div>

          {job.status === "failed" && (
            <div className="mt-4 rounded-[8px] border border-danger-line bg-danger-bg px-4 py-3">
              <p role="alert" className="text-base text-danger">
                {humanError(job.error_code)}
              </p>
              <p className="mt-2 text-caption text-muted">
                실패한 변환은 크레딧을 돌려드려요.
              </p>
            </div>
          )}

          {job.status === "failed" && <RetryVideoJob sourceUrl={job.source_video_url} characterId={job.character_id} />}
          {(job.status === "queued" || job.status === "processing") && <GenerationProgress
            title={job.status === "queued" ? "변환 접수 확인·대기 중" : "AI 영상 변환 중"}
            startedAt={job.created_at} expectedSeconds={180}
          />}

          <dl className="mt-6 rounded-[12px] border border-line bg-cream p-5">
            <Row label="캐릭터">
              <Link
                href={`/characters/${job.character_id}`}
                className="text-ink underline-offset-2 hover:underline"
              >
                {job.character_name}
              </Link>
            </Row>
            {LOOKS_ENABLED && <Row label="룩">{job.look_name ?? "—"}</Row>}
            <Row label="길이" numeric>
              {duration(job.duration_seconds)}
            </Row>
            <Row label="소모 크레딧" numeric>
              {credits(job.credits_spent)}
            </Row>
            <Row label="만든 시각">{fullTime(job.created_at)}</Row>
            {job.completed_at && (
              <Row label="끝난 시각" last>
                {fullTime(job.completed_at)}
              </Row>
            )}
          </dl>
        </div>
      </div>
    </>
  );
}

function Row({
  label,
  children,
  numeric,
  last,
}: {
  label: string;
  children: React.ReactNode;
  numeric?: boolean;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 py-3 first:pt-0 ${
        last ? "" : "border-b border-line"
      } last:border-0 last:pb-0`}
    >
      <dt className="shrink-0 text-caption text-muted">{label}</dt>
      <dd
        className={`min-w-0 truncate text-sm text-ink ${numeric ? "tabular" : ""}`}
      >
        {children}
      </dd>
    </div>
  );
}
