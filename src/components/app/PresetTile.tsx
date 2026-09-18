"use client";

import Image from "next/image";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PresetWithUrl } from "@/types/models";


export function PresetTile({
  preset,
  selected,
  onSelect,
  portrait = false,
}: {
  preset: PresetWithUrl;
  selected: boolean;
  onSelect: (id: string) => void;

  portrait?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect(preset.id)}
      className="group block w-full text-left"
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-[12px] border bg-sunken",
          portrait ? "aspect-[3/4]" : "aspect-square",
          "transition-[border-color,box-shadow] duration-150 ease-out",
          selected
            ? "border-primary ring-2 ring-primary ring-offset-2"
            : "border-line group-hover:border-line-strong",
        )}
      >
        {preset.thumbnail_url ? (
          <Image
            src={preset.thumbnail_url}
            alt=""
            fill
            sizes="(max-width: 640px) 33vw, 180px"
            className="object-cover"
          />
        ) : null}
        {selected && (
          <span
            className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-primary"
            aria-hidden
          >
            <Check className="size-3 text-on-dark" strokeWidth={2.5} />
          </span>
        )}
      </div>
      <p className="mt-2 line-clamp-2 text-caption text-ink">{preset.name}</p>
    </button>
  );
}
