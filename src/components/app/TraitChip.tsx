"use client";

import { MicroLabel } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  OPTION_KIND_LABEL,
  REQUIRED_TRAIT_KINDS,
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
 * 한 갈래(성별·나이대·머리…)의 칩 한 줄.
 * 필수 갈래는 한 번 더 눌러도 안 풀린다 — 빈 값이 허용되지 않는 자리다.
 */
export function TraitRow({
  kind,
  options,
  value,
  onChange,
  disabled,
}: {
  kind: OptionKind;
  options: CharacterOptionWithUrl[];
  value: string | undefined;
  onChange: (id: string | undefined) => void;
  disabled?: boolean;
}) {
  const required = REQUIRED_TRAIT_KINDS.includes(kind);

  return (
    <div>
      <MicroLabel>
        {OPTION_KIND_LABEL[kind]}
        {!required && <span className="ml-1 normal-case">· 비워도 돼요</span>}
      </MicroLabel>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <TraitChip
            key={option.id}
            label={option.name}
            selected={value === option.id}
            disabled={disabled}
            onSelect={() =>
              onChange(
                value === option.id && !required ? undefined : option.id,
              )
            }
          />
        ))}
      </div>
    </div>
  );
}
