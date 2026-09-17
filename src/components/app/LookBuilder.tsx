"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PresetTile } from "./PresetTile";
import { SummaryBar } from "./SummaryBar";
import { OptionalBadge } from "./TraitChip";
import { MicroLabel } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { invokeFunction } from "@/lib/supabase/functions";
import { isSupabaseConfigured } from "@/lib/env";
import { humanError } from "@/lib/errors";
import { cn } from "@/lib/utils";
import {
  OUTFIT_CATEGORIES,
  SLOT_LABEL,
  type CharacterListItem,
  type PresetSlot,
  type PresetWithUrl,
  type SlotSelection,
} from "@/types/models";

const COST = 1;

/** 다 골라야 하는 슬롯 */
const SLOTS: readonly PresetSlot[] = ["outfit"];
/** 골라도 되고 안 골라도 되는 슬롯 — 장소는 안 고르면 찍은 배경 그대로다 */
const OPTIONAL_SLOTS: readonly PresetSlot[] = ["scene"];
const ALL_SLOTS = [...SLOTS, ...OPTIONAL_SLOTS];

/**
 * 룩은 프리셋 슬롯만. 자유 프롬프트 없음. — README "이미 정해진 것"
 * 흔들면 원가와 품질이 같이 무너진다.
 *
 * 룩은 **코디 한 벌**이다. 머리는 캐릭터를 만들 때 사진으로 정했으니 여기서 안 고른다.
 * 장소는 선택이다 — 기본은 인물만 바꾸고 배경은 찍은 그대로 둔다. 자기 장소가 드러나는 게
 * 싫은 사용자만 장소를 고른다. — 마이그레이션 20260917000010·0011·0013
 */
export function LookBuilder({
  presets,
  characters,
  defaultCharacterId,
}: {
  presets: Record<PresetSlot, PresetWithUrl[]>;
  characters: CharacterListItem[];
  defaultCharacterId?: string;
}) {
  const router = useRouter();
  // 룩은 끝까지 만들어진 캐릭터 위에만 입힌다. — docs/기획서.md §5
  const usable = characters.filter(
    (c) => c.stage === "ready" && c.status === "done",
  );

  const [characterId, setCharacterId] = useState(
    defaultCharacterId && usable.some((c) => c.id === defaultCharacterId)
      ? defaultCharacterId
      : (usable[0]?.id ?? ""),
  );
  const [category, setCategory] = useState<string>(OUTFIT_CATEGORIES[0]);
  const [selection, setSelection] = useState<SlotSelection>({});
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedNames = useMemo(() => {
    const out: Partial<Record<PresetSlot, string>> = {};
    for (const slot of ALL_SLOTS) {
      const id = selection[slot];
      if (!id) continue;
      out[slot] = presets[slot].find((p) => p.id === id)?.name;
    }
    return out;
  }, [selection, presets]);

  const outfits = presets.outfit.filter((p) => p.category === category);

  function pick(slot: PresetSlot, id: string) {
    setSelection((prev) => ({ ...prev, [slot]: prev[slot] === id ? undefined : id }));
  }

  async function submit() {
    if (!characterId) {
      setError("캐릭터를 골라 주세요.");
      return;
    }
    if (!isSupabaseConfigured) {
      setError("아직 서버가 연결되지 않았어요.");
      return;
    }

    setPending(true);
    setError(null);

    try {
      const supabase = createClient();
      // 룩 생성도 GPU가 도는 행위라 Edge Function을 거친다. — CLAUDE.md 아키텍처 규칙 2
      const data = await invokeFunction<{ look_id: string }>(
        supabase,
        "create-look",
        {
          character_id: characterId,
          name:
            name.trim() ||
            ALL_SLOTS.map((s) => selectedNames[s])
              .filter(Boolean)
              .join(" "),
          outfit_preset_id: selection.outfit,
          // 안 고르면 보내지 않는다 — 서버가 배경을 그대로 둔다
          ...(selection.scene ? { scene_preset_id: selection.scene } : {}),
        },
      );

      router.push(`/looks?look=${data.look_id}`);
      router.refresh();
    } catch (e) {
      const code =
        typeof e === "object" && e && "message" in e ? String(e.message) : null;
      setError(humanError(code));
    } finally {
      setPending(false);
    }
  }

  const grid = "mt-3 grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6";

  return (
    <div className="pb-4">
      <div className="max-w-[420px]">
        <Label htmlFor="character">캐릭터</Label>
        <Select
          id="character"
          className="mt-2"
          value={characterId}
          onValueChange={setCharacterId}
          placeholder="캐릭터를 골라 주세요"
          items={usable.map((c) => ({ value: c.id, label: c.name }))}
        />
      </div>

      <div className="mt-5 max-w-[420px]">
        <Label htmlFor="look-name">룩 이름</Label>
        <Input
          id="look-name"
          className="mt-2"
          placeholder="비워두면 고른 조합으로 지어져요"
          value={name}
          maxLength={20}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <section className="mt-8">
        <MicroLabel>{SLOT_LABEL.outfit}</MicroLabel>
        <p className="mt-1 text-caption text-muted">
          전신 코디 한 벌을 골라요. 인물의 옷만 바뀌어요.
        </p>
        <div role="tablist" aria-label="코디 분류" className="mt-3 flex gap-2">
          {OUTFIT_CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={category === c}
              onClick={() => setCategory(c)}
              className={cn(
                "h-8 rounded-full border px-3 text-sm",
                "transition-[background-color,border-color] duration-150 ease-out",
                category === c
                  ? "border-ink bg-ink text-on-dark"
                  : "border-line text-body hover:bg-hover",
              )}
            >
              {c}
            </button>
          ))}
        </div>
        <div className={grid}>
          {outfits.map((preset) => (
            <PresetTile
              key={preset.id}
              preset={preset}
              portrait
              selected={selection.outfit === preset.id}
              onSelect={(id) => pick("outfit", id)}
            />
          ))}
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-center gap-2">
          <MicroLabel>{SLOT_LABEL.scene}</MicroLabel>
          <OptionalBadge />
        </div>
        <p className="mt-1 text-caption text-muted">
          고르지 않으면 찍은 장소가 그대로 나와요.
          <br />
          장소를 드러내고 싶지 않을 때만 골라요.
        </p>
        <div className={grid}>
          {presets.scene.map((preset) => (
            <PresetTile
              key={preset.id}
              preset={preset}
              selected={selection.scene === preset.id}
              onSelect={(id) => pick("scene", id)}
            />
          ))}
        </div>
      </section>

      {error && (
        <p role="alert" className="mt-6 text-caption text-danger">
          {error}
        </p>
      )}

      {/* 래퍼로 감싸지 않는다 — sticky가 움직일 공간이 없어진다. ActionBar 주석 참고 */}
      <SummaryBar
        className="mt-8"
        slots={SLOTS}
        optionalSlots={OPTIONAL_SLOTS}
        selectedNames={selectedNames}
        cost={COST}
        pending={pending}
        onSubmit={submit}
      />
    </div>
  );
}
