import Link from "next/link";
import Image from "next/image";
import { StatusBadge } from "./StatusBadge";
import { STAGE_LABEL, type CharacterListItem } from "@/types/models";

export function CharacterCard({ character }: { character: CharacterListItem }) {
  // 만드는 중인 캐릭터는 상세가 아니라 스튜디오로 이어진다. — docs/기획서.md §8
  const building = character.stage !== "ready";
  const href = building
    ? `/characters/${character.id}/build`
    : `/characters/${character.id}`;

  return (
    <Link href={href} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-[12px] border border-line bg-sunken transition-colors duration-150 ease-out group-hover:border-line-strong">
        {character.thumbnail_url ? (
          <Image
            src={character.thumbnail_url}
            alt=""
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
            className="object-cover"
          />
        ) : null}
        {(building || character.status !== "done") && (
          <span className="absolute left-2 top-2">
            <StatusBadge status={character.status} />
          </span>
        )}
      </div>
      <p className="mt-2 truncate text-sm text-ink">{character.name}</p>
      <p className="text-caption tabular text-muted">
        {building
          ? STAGE_LABEL[character.stage]
          : `룩 ${character.look_count} · 작업물 ${character.job_count}`}
      </p>
    </Link>
  );
}
