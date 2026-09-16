import Link from "next/link";
import Image from "next/image";
import { StatusBadge } from "./StatusBadge";
import type { CharacterListItem } from "@/types/models";

export function CharacterCard({ character }: { character: CharacterListItem }) {
  return (
    <Link href={`/characters/${character.id}`} className="group block">
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
        {character.status !== "done" && (
          <span className="absolute left-2 top-2">
            <StatusBadge status={character.status} />
          </span>
        )}
      </div>
      <p className="mt-2 truncate text-sm text-ink">{character.name}</p>
      <p className="text-caption tabular text-muted">
        룩 {character.look_count} · 작업물 {character.job_count}
      </p>
    </Link>
  );
}
