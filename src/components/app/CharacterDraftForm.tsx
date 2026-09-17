"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Stepper } from "./Stepper";
import { ToneTile } from "./ToneTile";
import { TraitRow } from "./TraitChip";
import { ActionBar } from "./ActionBar";
import { Input } from "@/components/ui/input";
import { Label, MicroLabel } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { invokeFunction } from "@/lib/supabase/functions";
import { isSupabaseConfigured } from "@/lib/env";
import { humanError } from "@/lib/errors";
import { withObjectParticle } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  CHARACTER_COST,
  CHARACTER_STEPS,
  OPTION_KIND_LABEL,
  REQUIRED_TRAIT_KINDS,
  TRAIT_KINDS,
  type CharacterOptionWithUrl,
  type OptionKind,
  type Traits,
} from "@/types/models";

/**
 * 캐릭터 만들기 1단계 — 톤과 속성을 고른다. — docs/기획서.md §2
 *
 * 사진을 올리지 않는다. 캐릭터는 처음부터 생성물이다.
 * 후보 뽑기는 GPU가 도는 행위라 Edge Function을 거친다. — CLAUDE.md 아키텍처 규칙 2
 */
export function CharacterDraftForm({
  options,
  balance,
}: {
  options: Record<OptionKind, CharacterOptionWithUrl[]>;
  /**
   * 남은 크레딧. 모자라면 다 고르기 전에 먼저 알려준다 — 한참 고른 뒤에
   * 402를 받는 것보다 낫다. 판정은 여전히 서버(charge_credits)가 한다. null이면 모른다.
   */
  balance: number | null;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [toneId, setToneId] = useState<string>("");
  const [traits, setTraits] = useState<Traits>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 화면에 나오는 순서대로 센다 — 이름 → 성별 → 톤 → 나이대
  const missing: string[] = [];
  if (!name.trim()) missing.push("이름");
  if (!traits.gender) missing.push(OPTION_KIND_LABEL.gender);
  if (!toneId) missing.push("톤");
  for (const kind of REQUIRED_TRAIT_KINDS) {
    if (kind !== "gender" && !traits[kind]) missing.push(OPTION_KIND_LABEL[kind]);
  }
  const complete = missing.length === 0;
  const short = balance !== null && balance < CHARACTER_COST.draft;

  const chosen = [
    options.tone.find((o) => o.id === toneId)?.name,
    ...TRAIT_KINDS.map(
      (kind) => options[kind].find((o) => o.id === traits[kind])?.name,
    ),
  ].filter(Boolean);

  async function draft() {
    if (!isSupabaseConfigured) {
      setError("아직 서버가 연결되지 않았어요.");
      return;
    }
    setPending(true);
    setError(null);

    try {
      const supabase = createClient();
      const data = await invokeFunction<{ character_id: string }>(
        supabase,
        "draft-character",
        { name: name.trim(), tone_id: toneId, traits },
      );

      router.push(`/characters/${data.character_id}/build`);
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
      <Stepper steps={CHARACTER_STEPS} current={0} />

      <div className="mt-8 max-w-[420px]">
        <Label htmlFor="name">캐릭터 이름</Label>
        <Input
          id="name"
          className="mt-2"
          placeholder="기본 나"
          value={name}
          maxLength={20}
          autoFocus
          onChange={(e) => setName(e.target.value)}
        />
        <p className="mt-2 text-caption text-muted">
          나중에 룩과 작업물을 고를 때 이 이름으로 찾게 돼요.
        </p>
      </div>

      {/*
        성별은 맨 처음에 정한다. 톤·머리·체형을 고를 때 이미 누구를 만드는지 알고 있어야
        나머지 선택이 자연스럽다. 아래 속성 칩 줄에는 다시 나오지 않는다.
      */}
      <section className="mt-8 max-w-[420px]">
        <MicroLabel>성별</MicroLabel>
        <div
          role="radiogroup"
          aria-label="성별"
          className="mt-3 grid gap-3"
          style={{ gridTemplateColumns: `repeat(${Math.max(options.gender.length, 1)}, minmax(0, 1fr))` }}
        >
          {options.gender.map((option) => {
            const selected = traits.gender === option.id;
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setTraits((prev) => ({ ...prev, gender: option.id }))}
                className={cn(
                  "h-12 rounded-[12px] border text-base",
                  "transition-[background-color,border-color,box-shadow] duration-150 ease-out",
                  selected
                    ? "border-ink bg-ink text-on-dark shadow-inset"
                    : "border-line bg-transparent text-ink hover:bg-hover",
                )}
              >
                {option.name}
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-8">
        <MicroLabel>톤</MicroLabel>
        <p className="mt-1 text-caption text-muted">
          톤은 지금만 정해요. 나중에 바꾸려면 후보부터 다시 뽑아야 해요.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {options.tone.map((option) => (
            <ToneTile
              key={option.id}
              option={option}
              selected={toneId === option.id}
              onSelect={setToneId}
            />
          ))}
        </div>
      </section>

      <div className="mt-8 flex flex-col gap-6">
        {TRAIT_KINDS.filter((kind) => kind !== "gender").map((kind) => (
          <TraitRow
            key={kind}
            kind={kind}
            options={options[kind]}
            value={traits[kind]}
            onChange={(id) => setTraits((prev) => ({ ...prev, [kind]: id }))}
          />
        ))}
      </div>

      {error && (
        <p role="alert" className="mt-6 text-caption text-danger">
          {error}
        </p>
      )}

      <p className="mt-6 text-caption text-muted">
        후보 4장을 뽑는 데 30초~2분 걸려요. 그중 하나를 골라서 다듬게 돼요.
      </p>

      {/* 래퍼로 감싸지 않는다 — sticky가 움직일 공간이 없어진다. ActionBar 주석 참고 */}
      <ActionBar
        className="mt-4"
        cost={CHARACTER_COST.draft}
        label="후보 뽑기"
        pendingLabel="뽑는 중…"
        pending={pending}
        disabled={!complete || short}
        onSubmit={draft}
        summary={
          short ? (
            <span className="text-muted">
              크레딧이 모자라요.{" "}
              <Link href="/credits" className="text-ink underline underline-offset-2">
                충전하면
              </Link>{" "}
              뽑을 수 있어요
            </span>
          ) : complete ? (
            chosen.join(" · ")
          ) : (
            <span className="text-muted">
              {withObjectParticle(missing.join(" · "))} 정하면 뽑을 수 있어요
            </span>
          )
        }
      />
    </div>
  );
}
