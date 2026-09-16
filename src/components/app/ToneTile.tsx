"use client";

import Image from "next/image";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CharacterOptionWithUrl } from "@/types/models";

/**
 * DESIGN.md §6 — ToneTile
 * PresetTile과 같은 규칙. 다른 점은 아래 라벨이 두 줄이라는 것뿐이다.
 * 썸네일이 없으면 이름만 그린다 — 톤 6장을 올리기 전에도 화면이 깨지지 않는다.
 */
export function ToneTile({
  option,
  selected,
  disabled,
  onSelect,
}: {
  option: CharacterOptionWithUrl;
  selected: boolean;
  disabled?: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={() => onSelect(option.id)}
      className="group block w-full text-left disabled:pointer-events-none disabled:opacity-40"
    >
      <div
        className={cn(
          "relative aspect-square overflow-hidden rounded-[12px] border bg-sunken",
          "transition-[border-color,box-shadow] duration-150 ease-out",
          selected
            ? "border-line-strong shadow-focus"
            : "border-line group-hover:border-line-strong",
        )}
      >
        {option.thumbnail_url ? (
          <Image
            src={option.thumbnail_url}
            alt=""
            fill
            sizes="(max-width: 640px) 50vw, 180px"
            className="object-cover"
          />
        ) : null}
        {selected && (
          <span
            className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-ink"
            aria-hidden
          >
            <Check className="size-3 text-on-dark" strokeWidth={2.5} />
          </span>
        )}
      </div>
      <p className="mt-2 truncate text-caption text-ink">{option.name}</p>
      {option.description && (
        <p className="truncate text-caption text-muted">{option.description}</p>
      )}
    </button>
  );
}
