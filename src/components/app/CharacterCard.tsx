import { LOOKS_ENABLED } from "@/features/looks/config";
import Link from "next/link";
import Image from "next/image";
import { UserRound, ArrowUpRight } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { STAGE_LABEL, type CharacterListItem } from "@/types/models";

export function CharacterCard({ character }: { character: CharacterListItem }) {
  // 만드는 중인 캐릭터는 상세가 아니라 스튜디오로 이어진다. — docs/기획서.md §8
  const building = character.stage !== "ready";
  const href = building
    ? `/characters/${character.id}/build`
    : `/characters/${character.id}`;

  return (
    <Link href={href} className="group block overflow-hidden rounded-[20px] border border-line bg-surface p-2 transition-colors hover:border-primary">
      <div className="relative aspect-[3/4] overflow-hidden rounded-[12px] border border-line bg-sunken transition-colors duration-150 ease-out group-hover:border-line-strong">
        {character.thumbnail_url ? (
          <Image
            src={character.thumbnail_url}
            alt=""
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
            className="object-cover"
          />
        ) : <div className="flex h-full items-center justify-center"><UserRound className="size-12 text-muted" aria-hidden /></div>}
        {(building || character.status !== "done") && (
          <span className="absolute left-2 top-2">
            <StatusBadge status={character.status} />
          </span>
        )}
      </div>
      <p className="mt-3 flex items-center justify-between gap-2 px-2 text-card font-semibold text-ink"><span className="truncate">{character.name}</span><ArrowUpRight className="size-4 shrink-0 text-muted" aria-hidden /></p>
      <p className="px-2 pb-3 pt-1 text-caption tabular text-muted">
        {building
          ? STAGE_LABEL[character.stage]
          : `${LOOKS_ENABLED ? `룩 ${character.look_count} · ` : ""}작업물 ${character.job_count}`}
      </p>
    </Link>
  );
}
