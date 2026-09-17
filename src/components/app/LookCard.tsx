import Link from "next/link";
import Image from "next/image";
import { Check } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import type { LookListItem, PresetSlot } from "@/types/models";

/** 카드 아래 요약 순서. 코디 룩은 상의·하의가 비어 있어 자연히 빠진다 */
const SUMMARY_SLOTS: PresetSlot[] = ["hair", "top", "bottom", "outfit", "scene"];

export function LookCard({ look }: { look: LookListItem }) {
  const summary = SUMMARY_SLOTS.map((slot) => look.preset_names[slot])
    .filter(Boolean)
    .join(" · ");

  return (
    <Link href={`/looks?look=${look.id}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-[12px] border border-line bg-sunken transition-colors duration-150 ease-out group-hover:border-line-strong">
        {look.thumbnail_url ? (
          <Image
            src={look.thumbnail_url}
            alt=""
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
            className="object-cover"
          />
        ) : null}
        {look.status !== "done" && (
          <span className="absolute left-2 top-2">
            <StatusBadge status={look.status} />
          </span>
        )}
        {look.is_adopted && (
          <span
            className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-ink shadow-inset"
            title="채택한 룩"
          >
            <Check className="size-3 text-on-dark" strokeWidth={2.5} aria-hidden />
            <span className="sr-only">채택한 룩</span>
          </span>
        )}
      </div>
      <p className="mt-2 truncate text-sm text-ink">{look.name}</p>
      <p className="truncate text-caption text-muted">{summary}</p>
    </Link>
  );
}
