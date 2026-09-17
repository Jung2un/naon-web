"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PresetTile } from "./PresetTile";
import { SummaryBar } from "./SummaryBar";
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
  type OutfitMode,
  type PresetSlot,
  type PresetWithUrl,
  type SlotSelection,
} from "@/types/models";

const COST = 1;

/** 방식마다 다 골라야 하는 슬롯, 화면 순서대로 */
const REQUIRED_SLOTS: Record<OutfitMode, readonly PresetSlot[]> = {
  separates: ["hair", "top", "bottom", "scene"],
  outfit: ["hair", "outfit", "scene"],
};

const MODE_LABEL: Record<OutfitMode, string> = {
  separates: "상의·하의 따로",
  outfit: "코디 한 벌",
};

/**
 * 룩은 프리셋 슬롯만. 자유 프롬프트 없음. — README "이미 정해진 것"
 * 흔들면 원가와 품질이 같이 무너진다.
 *
 * 옷은 상의·하의를 따로 고르거나 전신 코디 한 벌을 고른다. 둘을 섞지 않는다 —
 * 코디 위에 따로 고른 상의를 얹으면 지시문이 서로 싸운다.
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
  const [mode, setMode] = useState<OutfitMode>("separates");
  const [category, setCategory] = useState<string>(OUTFIT_CATEGORIES[0]);
  const [selection, setSelection] = useState<SlotSelection>({});
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slots = REQUIRED_SLOTS[mode];

  const selectedNames = useMemo(() => {
    const out: Partial<Record<PresetSlot, string>> = {};
    for (const slot of slots) {
      const id = selection[slot];
      if (!id) continue;
      out[slot] = presets[slot].find((p) => p.id === id)?.name;
    }
    return out;
  }, [selection, presets, slots]);

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
            slots
              .map((s) => selectedNames[s])
              .filter(Boolean)
              .join(" "),
          hair_preset_id: selection.hair,
          scene_preset_id: selection.scene,
          // 고른 방식의 옷만 보낸다. 다른 방식에서 골라 둔 값은 남아 있어도 싣지 않는다
          ...(mode === "outfit"
            ? { outfit_preset_id: selection.outfit }
            : { top_preset_id: selection.top, bottom_preset_id: selection.bottom }),
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
        <MicroLabel>{SLOT_LABEL.hair}</MicroLabel>
        <div className={grid}>
          {presets.hair.map((preset) => (
            <PresetTile
              key={preset.id}
              preset={preset}
              selected={selection.hair === preset.id}
              onSelect={(id) => pick("hair", id)}
            />
          ))}
        </div>
      </section>

      <section className="mt-8">
        <MicroLabel>옷</MicroLabel>
        <div
          role="radiogroup"
          aria-label="옷 고르는 방식"
          className="mt-3 grid max-w-[420px] grid-cols-2 gap-3"
        >
          {(Object.keys(MODE_LABEL) as OutfitMode[]).map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={mode === m}
              onClick={() => setMode(m)}
              className={cn(
                "h-12 rounded-[12px] border text-base",
                "transition-[background-color,border-color,box-shadow] duration-150 ease-out",
                mode === m
                  ? "border-ink bg-ink text-on-dark shadow-inset"
                  : "border-line bg-transparent text-ink hover:bg-hover",
              )}
            >
              {MODE_LABEL[m]}
            </button>
          ))}
        </div>

        {mode === "separates" ? (
          (["top", "bottom"] as const).map((slot) => (
            <div key={slot} className="mt-6">
              <MicroLabel>{SLOT_LABEL[slot]}</MicroLabel>
              <div className={grid}>
                {presets[slot].map((preset) => (
                  <PresetTile
                    key={preset.id}
                    preset={preset}
                    selected={selection[slot] === preset.id}
                    onSelect={(id) => pick(slot, id)}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="mt-6">
            <div role="tablist" aria-label="코디 분류" className="flex gap-2">
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
          </div>
        )}
      </section>

      <section className="mt-8">
        <MicroLabel>{SLOT_LABEL.scene}</MicroLabel>
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
        slots={slots}
        selectedNames={selectedNames}
        cost={COST}
        pending={pending}
        onSubmit={submit}
      />
    </div>
  );
}
