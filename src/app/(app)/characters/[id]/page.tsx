import { LOOKS_ENABLED } from "@/features/looks/config";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { Shirt, Film } from "lucide-react";
import { PageHeader, SectionHeader } from "@/components/app/PageHeader";
import { StatusBadge } from "@/components/app/StatusBadge";
import { JobCard, JobGrid } from "@/components/app/JobCard";
import { LookCard } from "@/features/looks/LookCard";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/button";
import { MicroLabel } from "@/components/ui/label";
import { getCharacter } from "@/lib/data/queries";
import { humanError } from "@/lib/errors";
import { fullTime } from "@/lib/format";
import { ANGLE_LABEL, REF_ANGLES, TRAIT_KINDS } from "@/types/models";

export async function generateMetadata({
  params,
}: PageProps<"/characters/[id]">): Promise<Metadata> {
  const { id } = await params;
  const character = await getCharacter(id);
  return { title: character?.name ?? "캐릭터" };
}

export default async function CharacterDetailPage({
  params,
}: PageProps<"/characters/[id]">) {
  const { id } = await params;
  const character = await getCharacter(id);
  if (!character) notFound();

  // 아직 만드는 중이면 스튜디오가 이어서 그린다. — docs/기획서.md §8
  if (character.stage !== "ready") redirect(`/characters/${id}/build`);

  const refByAngle = new Map(character.refs.map((r) => [r.angle, r]));
  const traitNames = TRAIT_KINDS.map((kind) => character.option_names[kind]).filter(
    Boolean,
  );

  return (
    <>
      <PageHeader
        title={character.name}
        back={{ href: "/characters", label: "캐릭터" }}
        action={
          character.status === "done" ? (
            <Button variant="primary" asChild>
              <Link href={LOOKS_ENABLED ? `/looks/new?character=${character.id}` : "/jobs/new"}>{LOOKS_ENABLED ? "룩 만들기" : "영상 변환하기"}</Link>
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status={character.status} />
        <span className="text-caption text-muted">
          {fullTime(character.created_at)}에 만들었어요
        </span>
      </div>

      {character.status === "failed" && (
        <p
          role="alert"
          className="mt-4 rounded-[8px] border border-danger-line bg-danger-bg px-4 py-3 text-base text-danger"
        >
          {humanError(character.error_code)}
        </p>
      )}

      {(character.option_names.tone || traitNames.length > 0) && (
        <section className="mt-8">
          <MicroLabel>톤과 속성</MicroLabel>
          <p className="mt-2 text-base text-body">
            {[character.option_names.tone, ...traitNames].filter(Boolean).join(" · ")}
          </p>
        </section>
      )}

      <section className="mt-8">
        <MicroLabel>3방향</MicroLabel>
        <div className="mt-3 grid max-w-[560px] grid-cols-3 gap-4">
          {REF_ANGLES.map((angle) => {
            const ref = refByAngle.get(angle);
            return (
              <div key={angle}>
                <div className="relative aspect-[3/4] overflow-hidden rounded-[12px] border border-line bg-sunken">
                  {ref?.image_url ? (
                    <Image
                      src={ref.image_url}
                      alt={ANGLE_LABEL[angle]}
                      fill
                      sizes="(max-width: 640px) 30vw, 180px"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <p className="mt-2 text-caption text-muted">{ANGLE_LABEL[angle]}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-10">
        <SectionHeader
          title="룩"
          action={
            character.looks.length > 0 ? (
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/looks/new?character=${character.id}`}>룩 만들기</Link>
              </Button>
            ) : undefined
          }
        />
        {character.looks.length === 0 ? (
          <EmptyState
            icon={Shirt}
            title="아직 룩이 없어요"
            description="코디 한 벌을 고르면 이 캐릭터의 룩이 만들어져요. 배경은 찍은 장소 그대로예요."
            action={{
              label: "룩 만들기",
              href: `/looks/new?character=${character.id}`,
            }}
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {character.looks.map((look) => (
              <LookCard key={look.id} look={look} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <SectionHeader
          title="최근 작업물"
          action={
            character.recent_jobs.length > 0 ? (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/jobs">전체 보기</Link>
              </Button>
            ) : undefined
          }
        />
        {character.recent_jobs.length === 0 ? (
          <EmptyState
            icon={Film}
            title="아직 작업물이 없어요"
            description="앱에서 이 캐릭터로 영상을 찍으면 여기에 나타나요."
            action={{ label: "작업물 보기", href: "/jobs" }}
          />
        ) : (
          <JobGrid>
            {character.recent_jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </JobGrid>
        )}
      </section>
    </>
  );
}
