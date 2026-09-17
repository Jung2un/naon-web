"use client";

import Image from "next/image";
import { Check } from "lucide-react";
import { MicroLabel } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  OPTION_KIND_LABEL,
  REQUIRED_TRAIT_KINDS,
  matchesGender,
  type CharacterOptionWithUrl,
  type OptionKind,
} from "@/types/models";

/**
 * DESIGN.md §6 — TraitChip
 * 필 라운드가 허용되는 자리다(필터 필). 선택됨 = 차콜 채움 + inset shadow.
 * 체크 아이콘을 넣지 않는다 — 채움으로 이미 읽힌다.
 */
export function TraitChip({
  label,
  selected,
  disabled,
  onSelect,
}: {
  label: string;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "relative inline-flex h-8 items-center rounded-full border px-3 text-sm",
        "transition-[background-color,border-color,box-shadow] duration-150 ease-out",
        "active:opacity-80 disabled:pointer-events-none disabled:opacity-40",
        // 터치 대상 최소 44px — 시각 높이가 작아도 투명 영역으로 채운다
        "before:absolute before:left-0 before:top-1/2 before:h-11 before:w-full before:-translate-y-1/2 before:content-['']",
        selected
          ? "border-ink bg-ink text-on-dark shadow-inset"
          : "border-line bg-transparent text-body hover:bg-hover",
      )}
    >
      {label}
    </button>
  );
}

/**
 * 사진이 있는 옵션(성별별 머리)의 타일. PresetTile과 같은 규칙 — 1:1, 라운드 12px,
 * 선택됨 = 테두리 --border-interactive + 우상단 차콜 원 안에 흰 체크.
 */
export function TraitTile({
  label,
  imageUrl,
  selected,
  disabled,
  onSelect,
}: {
  label: string;
  imageUrl: string;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onSelect}
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
        <Image
          src={imageUrl}
          alt=""
          fill
          sizes="(max-width: 640px) 25vw, 140px"
          className="object-cover"
        />
        {selected && (
          <span
            className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-ink"
            aria-hidden
          >
            <Check className="size-3 text-on-dark" strokeWidth={2.5} />
          </span>
        )}
      </div>
      <p className="mt-2 truncate text-caption text-ink">{label}</p>
    </button>
  );
}

/**
 * 한 갈래(성별·나이대·머리…)의 한 줄.
 * 필수 갈래는 한 번 더 눌러도 안 풀린다 — 빈 값이 허용되지 않는 자리다.
 *
 * gender를 주면 그 성별 옵션만 보여준다(gender_id가 없는 옵션은 성별 공통).
 * 보여줄 옵션이 전부 사진을 갖고 있으면 칩 대신 사진 타일로 그린다 — 지금은 머리가 그렇다.
 */
export function TraitRow({
  kind,
  options,
  value,
  onChange,
  disabled,
  gender,
}: {
  kind: OptionKind;
  options: CharacterOptionWithUrl[];
  value: string | undefined;
  onChange: (id: string | undefined) => void;
  disabled?: boolean;
  gender?: string;
}) {
  const required = REQUIRED_TRAIT_KINDS.includes(kind);
  const visible = options.filter((option) => matchesGender(option, gender));
  const asTiles =
    visible.length > 0 && visible.every((option) => Boolean(option.thumbnail_url));

  const toggle = (id: string) =>
    onChange(value === id && !required ? undefined : id);

  return (
    <div>
      <MicroLabel>
        {OPTION_KIND_LABEL[kind]}
        {!required && <span className="ml-1 normal-case">· 비워도 돼요</span>}
      </MicroLabel>
      {asTiles ? (
        <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {visible.map((option) => (
            <TraitTile
              key={option.id}
              label={option.name}
              imageUrl={option.thumbnail_url!}
              selected={value === option.id}
              disabled={disabled}
              onSelect={() => toggle(option.id)}
            />
          ))}
        </div>
      ) : (
        <div className="mt-2 flex flex-wrap gap-2">
          {visible.map((option) => (
            <TraitChip
              key={option.id}
              label={option.name}
              selected={value === option.id}
              disabled={disabled}
              onSelect={() => toggle(option.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
