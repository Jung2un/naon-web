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
  PRESET_SLOTS,
  SLOT_LABEL,
  type CharacterListItem,
  type PresetSlot,
  type PresetWithUrl,
  type SlotSelection,
} from "@/types/models";

const COST = 1;

/**
 * 룩은 프리셋 슬롯만. 자유 프롬프트 없음. — README "이미 정해진 것"
 * 흔들면 원가와 품질이 같이 무너진다.
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
  const usable = characters.filter((c) => c.status === "done");

  const [characterId, setCharacterId] = useState(
    defaultCharacterId && usable.some((c) => c.id === defaultCharacterId)
      ? defaultCharacterId
      : (usable[0]?.id ?? ""),
  );
  const [selection, setSelection] = useState<SlotSelection>({});
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedNames = useMemo(() => {
    const out: Partial<Record<PresetSlot, string>> = {};
    for (const slot of PRESET_SLOTS) {
      const id = selection[slot];
      if (!id) continue;
      out[slot] = presets[slot].find((p) => p.id === id)?.name;
    }
    return out;
  }, [selection, presets]);

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
            PRESET_SLOTS.map((s) => selectedNames[s])
              .filter(Boolean)
              .join(" "),
          hair_preset_id: selection.hair,
          top_preset_id: selection.top,
          bottom_preset_id: selection.bottom,
          scene_preset_id: selection.scene,
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

      {PRESET_SLOTS.map((slot) => (
        <section key={slot} className="mt-8">
          <MicroLabel>{SLOT_LABEL[slot]}</MicroLabel>
          <div className="mt-3 grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            {presets[slot].map((preset) => (
              <PresetTile
                key={preset.id}
                preset={preset}
                selected={selection[slot] === preset.id}
                onSelect={(id) =>
                  setSelection((prev) => ({
                    ...prev,
                    [slot]: prev[slot] === id ? undefined : id,
                  }))
                }
              />
            ))}
          </div>
        </section>
      ))}

      {error && (
        <p role="alert" className={cn("mt-6 text-caption text-danger")}>
          {error}
        </p>
      )}

      <div className="mt-8">
        <SummaryBar
          selectedNames={selectedNames}
          cost={COST}
          pending={pending}
          onSubmit={submit}
        />
      </div>
    </div>
  );
}
