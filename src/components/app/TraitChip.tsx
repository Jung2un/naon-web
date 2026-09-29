"use client";

import Image from "next/image";
import { HairColorSwatch } from "./HairColorSwatch";
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
        "relative inline-flex h-11 items-center rounded-full border px-3 text-sm",
        "transition-[background-color,border-color,box-shadow] duration-150 ease-out",
        "active:opacity-80 disabled:pointer-events-none disabled:opacity-40",
        // 터치 대상 최소 44px — 시각 높이가 작아도 투명 영역으로 채운다
        "before:absolute before:left-0 before:top-1/2 before:h-11 before:w-full before:-translate-y-1/2 before:content-['']",
        selected
          ? "border-primary bg-primary-soft text-primary"
          : "border-line bg-transparent text-body hover:bg-hover",
      )}
    >
      {label}
    </button>
  );
}


export function OptionalBadge() {
  return (
    <span className="inline-flex h-[18px] items-center rounded-[4px] bg-sunken px-1.5 text-[11px] leading-none text-muted">
      선택
    </span>
  );
}


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
            ? "border-primary ring-2 ring-primary ring-offset-2"
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
            className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-primary"
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
  // 이 성별에 쓸 옵션이 하나도 없으면 줄을 안 그린다 — 중성적에는 얼굴상이 없다
  if (visible.length === 0) return null;
  const asTiles =
    visible.length > 0 && visible.every((option) => Boolean(option.thumbnail_url));

  const toggle = (id: string) =>
    onChange(value === id && !required ? undefined : id);

  return (
    <div>
      <div className="flex items-center gap-2">
        <MicroLabel>{OPTION_KIND_LABEL[kind]}</MicroLabel>
        {!required && <OptionalBadge />}
      </div>
      {kind === "hair_color" ? (
        <div className="mt-3">
          <p className="mb-3 text-caption text-muted">머릿결 견본을 눌러 색을 골라요. 한 번 더 누르면 선택이 해제돼요.</p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-7">{visible.map(option=><HairColorSwatch key={option.id} label={option.name} selected={value===option.id} disabled={disabled} onSelect={()=>toggle(option.id)}/>)}</div>
          <p className="mt-1 text-caption text-muted">조명과 캐릭터의 톤에 따라 실제 색감은 달라질 수 있어요.</p>
        </div>
      ) : asTiles ? (
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
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
