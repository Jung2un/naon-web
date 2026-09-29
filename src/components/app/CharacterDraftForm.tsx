"use client";

import { GenerationProgress } from "./GenerationProgress";
import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Stepper, scrollToStep, stepAnchor } from "./Stepper";
import { ToneTile } from "./ToneTile";
import { TraitRow } from "./TraitChip";
import { ActionBar } from "./ActionBar";
import { MicroLabel } from "@/components/ui/label";
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
  TRAIT_DISPLAY_KINDS,
  setGender,
  type CharacterOptionWithUrl,
  type OptionKind,
  type Traits,
} from "@/types/models";

/** 톤·머리 다음에 칩으로 고르는 갈래, 화면 순서대로 — 머리색 → 나이대 → 체형 → 분위기 */
const LATER_KINDS = TRAIT_DISPLAY_KINDS.filter(
  (kind) => kind !== "gender" && kind !== "face" && kind !== "hair",
);

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
  const [toneId, setToneId] = useState<string>("");
  // 성별은 여성으로 시작한다(시드 sort_order 1). 비어 있으면 톤 사진을 고를 기준이 없다.
  const [traits, setTraits] = useState<Traits>(() =>
    options.gender[0] ? { gender: options.gender[0].id } : {},
  );
  const requestLock = useRef(false);
  const [startedAt, setStartedAt] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 화면에 나오는 순서대로 센다 — 성별 → 톤 → (머리) → 나이대. 이름은 3단계 다듬기 뒤에 정한다
  const missing: string[] = [];
  if (!traits.gender) missing.push(OPTION_KIND_LABEL.gender);
  if (!toneId) missing.push("톤");
  for (const kind of REQUIRED_TRAIT_KINDS) {
    if (kind !== "gender" && !traits[kind]) missing.push(OPTION_KIND_LABEL[kind]);
  }
  const complete = missing.length === 0;
  const short = balance !== null && balance < CHARACTER_COST.draft;

  const nameOf = (kind: OptionKind) =>
    options[kind].find((o) => o.id === traits[kind])?.name;
  const chosen = [
    nameOf("gender"),
    nameOf("face"),
    options.tone.find((o) => o.id === toneId)?.name,
    nameOf("hair"),
    ...LATER_KINDS.map(nameOf),
  ].filter(Boolean);

  async function draft() {
    if (!isSupabaseConfigured) {
      setError("아직 서버가 연결되지 않았어요.");
      return;
    }
    if (requestLock.current) return;
    requestLock.current = true;
    setStartedAt(new Date().toISOString());
    setPending(true);
    setError(null);

    try {
      const supabase = createClient();
      const data = await invokeFunction<{ character_id: string }>(
        supabase,
        "draft-character",
        // 이름은 안 보낸다. 3단계에서 완성할 때 정한다 — build-character
        { tone_id: toneId, traits },
      );

      router.push(`/characters/${data.character_id}/build`);
      router.refresh();
    } catch (e) {
      const code =
        typeof e === "object" && e && "message" in e ? String(e.message) : null;
      setError(humanError(code));
    } finally {
      requestLock.current = false;
      setPending(false);
    }
  }

  return (
    <div className="pb-4">
      {/* 1단계에서는 1단계만 누를 수 있다. 2~4단계는 후보를 뽑아야 생기는 화면이다 */}
      <Stepper
        steps={CHARACTER_STEPS}
        current={0}
        onStepClick={scrollToStep}
        isStepEnabled={(i) => i === 0}
      />

      {/*
        성별은 맨 처음에 정한다. 누구를 만드는지가 정해져야 톤 사진부터 그 성별로 보여줄 수 있다.
        아래 속성 칩 줄에는 다시 나오지 않는다.
      */}
      <section id={stepAnchor(0)} className="mt-8 max-w-[420px] scroll-mt-20">
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
                onClick={() => setTraits((prev) => setGender(prev, option.id, options))}
                className={cn(
                  "h-12 rounded-[12px] border text-base",
                  "transition-[background-color,border-color,box-shadow] duration-150 ease-out",
                  selected
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-line bg-transparent text-ink hover:bg-hover",
                )}
              >
                {option.name}
              </button>
            );
          })}
        </div>
      </section>

      {/*
        얼굴상은 얼굴의 인상 자체라 성별 바로 다음, 후보를 뽑기 전에 정한다.
        고른 얼굴을 다듬는 단계에서는 못 바꾼다 — 얼굴을 바꾸는 건 다른 사람을 만드는 일이다.
        중성적에는 얼굴상이 없어서 이 줄이 안 나온다.
      */}
      <section className="mt-8">
        <TraitRow
          kind="face"
          options={options.face}
          gender={traits.gender}
          value={traits.face}
          onChange={(id) => setTraits((prev) => ({ ...prev, face: id }))}
        />
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
              imageUrl={
                traits.gender ? option.thumbnail_variants?.[traits.gender] : undefined
              }
              selected={toneId === option.id}
              onSelect={setToneId}
            />
          ))}
        </div>
      </section>

      {/* 머리는 톤처럼 사진을 보고 고른다. 고른 성별의 머리만 나온다 */}
      <section className="mt-8">
        <TraitRow
          kind="hair"
          options={options.hair}
          gender={traits.gender}
          value={traits.hair}
          onChange={(id) => setTraits((prev) => ({ ...prev, hair: id }))}
        />
      </section>

      <div className="mt-8 flex flex-col gap-6">
        {LATER_KINDS.map((kind) => (
          <TraitRow
            key={kind}
            kind={kind}
            options={options[kind]}
            gender={traits.gender}
            value={traits[kind]}
            onChange={(id) => setTraits((prev) => ({ ...prev, [kind]: id }))}
          />
        ))}
      </div>

      {pending && <GenerationProgress title="후보 생성 요청 접수 중" startedAt={startedAt} expectedSeconds={30} background={false} />}
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
