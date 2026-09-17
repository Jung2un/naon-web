"use client";

import Image from "next/image";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PresetWithUrl } from "@/types/models";

/**
 * DESIGN.md §6 — PresetTile
 * 1:1 정사각, 라운드 12px, 1px solid --border-subtle.
 * 선택됨 = 테두리 --border-interactive + 우상단 차콜 원 안에 흰 체크 + --shadow-focus.
 * 선택 상태에 채도 있는 색을 쓰지 않는다.
 */
export function PresetTile({
  preset,
  selected,
  onSelect,
  portrait = false,
}: {
  preset: PresetWithUrl;
  selected: boolean;
  onSelect: (id: string) => void;
  /** 전신 코디는 세로로 긴 사진이라 3:4로 그린다 */
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
            ? "border-line-strong shadow-focus"
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
            className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-ink"
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
