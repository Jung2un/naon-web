"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Check } from "lucide-react";
import { Stepper, scrollToStep, stepAnchor } from "./Stepper";
import { ToneTile } from "./ToneTile";
import { TraitRow } from "./TraitChip";
import { ActionBar } from "./ActionBar";
import { SectionHeader } from "./PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, MicroLabel } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { invokeFunction } from "@/lib/supabase/functions";
import { isSupabaseConfigured } from "@/lib/env";
import { humanError } from "@/lib/errors";
import { credits } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  ANGLE_LABEL,
  CHARACTER_COST,
  CHARACTER_STEPS,
  PLACEHOLDER_CHARACTER_NAME,
  REFINABLE_TRAIT_KINDS,
  setGender,
  REF_ANGLES,
  STAGE_STEP,
  TRAIT_DISPLAY_KINDS,
  asTraits,
  type CharacterBuild,
  type CharacterImageWithUrl,
  type Traits,
} from "@/types/models";

/**
 * 캐릭터 스튜디오 — 만들기 2~4단계. — docs/기획서.md §2
 *
 *   2단계 후보 고르기 (stage=draft)    고르는 건 공짜, 다시 뽑기는 1크레딧
 *   3단계 다듬기      (stage=refining) 수정 1회 1크레딧, 되돌리기는 공짜
 *   4단계 완성        (stage=building) 3방향 2크레딧
 *
 * 상태는 여기 들고 있지 않는다. 서버 컴포넌트가 읽어 내려주고, 바뀌면 Realtime이
 * 다시 그리게 한다. — CLAUDE.md 아키텍처 규칙 1
 */
export function CharacterStudio({ character }: { character: CharacterBuild }) {
  const router = useRouter();
  const serverTraits = asTraits(character.traits);

  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toneId, setToneId] = useState(character.tone_id ?? "");
  // 이름은 다듬기가 끝나고 완성할 때 정한다. 그 전까지 서버에는 임시 이름이 들어 있다
  const [name, setName] = useState(
    character.name === PLACEHOLDER_CHARACTER_NAME ? "" : character.name,
  );
  const nameReady = name.trim().length > 0 && name.trim().length <= 20;
  const [traits, setTraits] = useState<Traits>(serverTraits);
  const [syncedAt, setSyncedAt] = useState(character.updated_at);

  // 서버에서 캐릭터가 바뀌면(수정이 끝났다든가) 칩도 그 값으로 돌아온다.
  if (character.updated_at !== syncedAt) {
    setSyncedAt(character.updated_at);
    setTraits(serverTraits);
    setToneId(character.tone_id ?? "");
  }

  const working = character.status === "processing";
  const candidates = latestRound(character.images, "candidate");
  const views = latestRound(character.images, "view");
  const versions = character.images.filter(
    (image) =>
      image.status === "done" &&
      image.image_url &&
      (image.kind === "candidate" || image.kind === "refined"),
  );

  const changed = REFINABLE_TRAIT_KINDS.some(
    (kind) => traits[kind] && traits[kind] !== serverTraits[kind],
  );

  async function run(
    action: string,
    fn: (supabase: ReturnType<typeof createClient>) => Promise<void>,
  ) {
    if (!isSupabaseConfigured) {
      setError("아직 서버가 연결되지 않았어요.");
      return;
    }
    setPending(action);
    setError(null);
    try {
      await fn(createClient());
      router.refresh();
    } catch (e) {
      const code =
        typeof e === "object" && e && "message" in e ? String(e.message) : null;
      setError(humanError(code));
    } finally {
      setPending(null);
    }
  }

  /**
   * 후보 고르기와 되돌리기. 돈도 GPU도 안 쓰는 행위라 Edge Function이 아니라
   * SQL 함수를 부른다. 소유권 확인은 그 함수 안에서 한다. — 기획서 §6
   */
  const select = (imageId: string) =>
    run("select", async (supabase) => {
      const { data, error: rpcError } = await supabase.rpc(
        "select_character_image",
        { p_character_id: character.id, p_image_id: imageId },
      );
      if (rpcError) throw rpcError;
      if (data === "busy") throw new Error("CHARACTER_BUSY");
      if (data !== "ok") throw new Error("CHARACTER_NOT_FOUND");
    });

  const redraft = () =>
    run("redraft", async (supabase) => {
      await invokeFunction(supabase, "draft-character", {
        character_id: character.id,
        tone_id: toneId,
        traits,
      });
    });

  const refine = () =>
    run("refine", async (supabase) => {
      await invokeFunction(supabase, "refine-character", {
        character_id: character.id,
        traits,
      });
    });

  const build = () =>
    run("build", async (supabase) => {
      await invokeFunction(supabase, "build-character", {
        character_id: character.id,
        name: name.trim(),
      });
    });

  return (
    <div className="pb-4">
      <Stepper
        steps={CHARACTER_STEPS}
        current={STAGE_STEP[character.stage]}
        onStepClick={scrollToStep}
        isStepEnabled={(i) => STEPS_ON_SCREEN[character.stage].includes(i)}
      />

      {character.status === "failed" && (
        <p
          role="alert"
          className="mt-6 rounded-[8px] border border-danger-line bg-danger-bg px-4 py-3 text-base text-danger"
        >
          {humanError(character.error_code)}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-6 text-caption text-danger">
          {error}
        </p>
      )}

      {character.stage === "draft" && (
        <>
          <section id={stepAnchor(1)} className="mt-8 scroll-mt-20">
            <SectionHeader title="마음에 드는 얼굴 고르기" />
            <p className="text-base text-body">
              하나를 고르면 그 얼굴을 유지한 채로 다듬을 수 있어요. 고르는 건 크레딧이
              안 들어요.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {candidates.map((image) => (
                <ImageSlot
                  key={image.id}
                  image={image}
                  disabled={working || Boolean(pending)}
                  onSelect={() => select(image.id)}
                />
              ))}
            </div>
          </section>

          <section id={stepAnchor(0)} className="mt-10 scroll-mt-20">
            <SectionHeader title="설정 바꿔서 다시 뽑기" />
            <p className="text-caption text-muted">
              톤·성별·나이대는 여기서만 바꿀 수 있어요. 고른 얼굴을 다듬는 단계에서는
              머리·머리색·체형·분위기만 바뀌어요.
            </p>

            <div className="mt-4">
              <MicroLabel>톤</MicroLabel>
              <div className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {character.options.tone.map((option) => (
                  <ToneTile
                    key={option.id}
                    option={option}
                    imageUrl={
                      traits.gender ? option.thumbnail_variants?.[traits.gender] : undefined
                    }
                    selected={toneId === option.id}
                    disabled={working}
                    onSelect={setToneId}
                  />
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-6">
              {TRAIT_DISPLAY_KINDS.map((kind) => (
                <TraitRow
                  key={kind}
                  kind={kind}
                  options={character.options[kind]}
                  gender={traits.gender}
                  value={traits[kind]}
                  disabled={working}
                  onChange={(id) =>
                    setTraits((prev) =>
                      kind === "gender" && id
                        ? setGender(prev, id, character.options)
                        : { ...prev, [kind]: id },
                    )
                  }
                />
              ))}
            </div>
          </section>

          <ActionBar
            className="mt-8"
            cost={CHARACTER_COST.draft}
            label="다시 뽑기"
            pendingLabel="뽑는 중…"
            pending={pending === "redraft"}
            disabled={working || Boolean(pending) || !toneId}
            onSubmit={redraft}
            summary={
              working ? (
                <span className="text-muted">
                  4장을 뽑고 있어요. 30초~2분 걸려요
                </span>
              ) : (
                <span className="text-muted">
                  지금 설정으로 4장을 새로 만들어요. 지금 후보는 그대로 남아요
                </span>
              )
            }
          />
        </>
      )}

      {character.stage === "refining" && (
        <>
          <section id={stepAnchor(1)} className="mt-8 flex scroll-mt-20 flex-col gap-6 sm:flex-row">
            <div className="w-full sm:max-w-[260px]">
              <MicroLabel>지금 얼굴</MicroLabel>
              <div className="relative mt-2 aspect-[3/4] overflow-hidden rounded-[12px] border border-line bg-sunken">
                {working ? (
                  <Skeleton className="size-full rounded-none" />
                ) : character.base_image_url ? (
                  <Image
                    src={character.base_image_url}
                    alt=""
                    fill
                    sizes="260px"
                    className="object-cover"
                  />
                ) : null}
              </div>
              {working && (
                <p className="mt-2 text-caption text-muted">
                  수정을 반영하는 중이에요. 30초~2분 걸려요.
                </p>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <MicroLabel>지금까지 만든 얼굴</MicroLabel>
              <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                {versions.map((image) => (
                  <button
                    key={image.id}
                    type="button"
                    disabled={working || Boolean(pending)}
                    onClick={() => select(image.id)}
                    className="shrink-0 disabled:pointer-events-none disabled:opacity-40"
                  >
                    <span
                      className={cn(
                        "relative block h-20 w-16 overflow-hidden rounded-[8px] border bg-sunken",
                        "transition-[border-color,box-shadow] duration-150 ease-out",
                        image.image_path === character.base_image_path
                          ? "border-line-strong shadow-focus"
                          : "border-line hover:border-line-strong",
                      )}
                    >
                      {image.image_url && (
                        <Image
                          src={image.image_url}
                          alt=""
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      )}
                    </span>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-caption text-muted">
                이전 얼굴을 누르면 그대로 되돌아가요. 되돌리는 건 크레딧이 안 들어요.
              </p>
            </div>
          </section>

          <section id={stepAnchor(2)} className="mt-10 scroll-mt-20">
            <SectionHeader title="다듬기" />
            <p className="text-base text-body">
              바꾼 항목만 고쳐져요. 얼굴은 그대로 유지돼요.
            </p>

            <div className="mt-5 flex flex-col gap-6">
              {REFINABLE_TRAIT_KINDS.map((kind) => (
                <TraitRow
                  key={kind}
                  kind={kind}
                  options={character.options[kind]}
                  gender={traits.gender}
                  value={traits[kind]}
                  disabled={working}
                  onChange={(id) => setTraits((prev) => ({ ...prev, [kind]: id }))}
                />
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                onClick={refine}
                disabled={!changed || working || Boolean(pending)}
              >
                {pending === "refine" ? "고치는 중…" : "이 수정 적용"}
              </Button>
              <span className="text-caption text-muted">
                크레딧{" "}
                <span className="tabular text-ink">
                  {credits(CHARACTER_COST.refine)}
                </span>
              </span>
            </div>

            <div id={stepAnchor(0)} className="mt-4 flex scroll-mt-20 flex-wrap items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={redraft}
                disabled={working || Boolean(pending)}
              >
                {pending === "redraft" ? "뽑는 중…" : "후보부터 다시 뽑기"}
              </Button>
              <span className="text-caption text-muted">
                톤·성별·나이대를 바꾸려면 다시 뽑아야 해요 · 크레딧{" "}
                <span className="tabular text-ink">
                  {credits(CHARACTER_COST.draft)}
                </span>
              </span>
            </div>
          </section>

          {/* 이름은 여기서 정한다 — 얼굴을 다 다듬고 나서야 이름 짓기가 쉽다 */}
          <section id={stepAnchor(3)} className="mt-10 max-w-[420px] scroll-mt-20">
            <Label htmlFor="character-name">캐릭터 이름</Label>
            <Input
              id="character-name"
              className="mt-2"
              placeholder="기본 나"
              value={name}
              maxLength={20}
              disabled={working}
              onChange={(e) => setName(e.target.value)}
            />
            <p className="mt-2 text-caption text-muted">
              나중에 룩과 작업물을 고를 때 이 이름으로 찾게 돼요.
            </p>
          </section>

          <ActionBar
            className="mt-8"
            cost={CHARACTER_COST.build}
            label="캐릭터 완성하기"
            pendingLabel="시작하는 중…"
            pending={pending === "build"}
            disabled={
              working || Boolean(pending) || !character.base_image_path || !nameReady
            }
            onSubmit={build}
            summary={
              <span className="text-muted">
                {nameReady
                  ? "이 얼굴로 정면 · 좌 45° · 우 45° 세 장을 뽑아요"
                  : "캐릭터 이름을 적으면 완성할 수 있어요"}
              </span>
            }
          />
        </>
      )}

      {character.stage === "building" && (
        <section id={stepAnchor(3)} className="mt-8 scroll-mt-20">
          <SectionHeader title="3방향 뽑는 중" />
          <p className="text-base text-body">
            1~3분 걸려요. 다 되면 캐릭터 화면으로 넘어가요. 이 화면을 닫아도 계속
            만들어져요.
          </p>
          <div className="mt-5 grid max-w-[560px] grid-cols-3 gap-4">
            {REF_ANGLES.map((angle) => {
              const image = views.find((v) => v.angle === angle);
              return (
                <div key={angle}>
                  <ImageSlot image={image} />
                  <p className="mt-2 text-caption text-muted">
                    {ANGLE_LABEL[angle]}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

/**
 * 스튜디오 단계(stage)마다 화면에 실제로 그려지는 스테퍼 칸.
 * 여기 없는 칸은 누를 수 없다 — 서버에서 렌더할 때도 같은 값이라 하이드레이션이 어긋나지 않는다.
 */
const STEPS_ON_SCREEN: Record<CharacterBuild["stage"], number[]> = {
  draft: [0, 1],
  refining: [0, 1, 2, 3],
  building: [3],
  ready: [],
};

/** 배치는 회차 단위다. 지난 회차는 화면에 안 그린다. */
function latestRound(
  images: CharacterImageWithUrl[],
  kind: CharacterImageWithUrl["kind"],
): CharacterImageWithUrl[] {
  const rows = images.filter((image) => image.kind === kind);
  if (rows.length === 0) return [];
  const round = Math.max(...rows.map((row) => row.round));
  return rows.filter((row) => row.round === round);
}

/**
 * 한 칸. 뽑는 중이면 같은 치수의 스켈레톤이 서고, 도착하면 그 자리가 채워진다 —
 * 자리가 흔들리지 않게. — DESIGN.md §6 후보 그리드
 */
function ImageSlot({
  image,
  disabled,
  onSelect,
}: {
  image?: CharacterImageWithUrl;
  disabled?: boolean;
  onSelect?: () => void;
}) {
  if (!image || image.status === "queued" || image.status === "processing") {
    return <Skeleton className="aspect-[3/4] w-full rounded-[12px]" />;
  }

  if (image.status === "failed" || !image.image_url) {
    return (
      <div className="flex aspect-[3/4] w-full items-center justify-center rounded-[12px] border border-danger-line bg-danger-bg px-3 text-center text-caption text-danger">
        이 장은 실패했어요
      </div>
    );
  }

  const inner = (
    <span className="relative block aspect-[3/4] w-full overflow-hidden rounded-[12px] border border-line bg-sunken transition-[border-color,box-shadow] duration-150 ease-out group-hover:border-line-strong">
      <Image
        src={image.image_url}
        alt=""
        fill
        sizes="(max-width: 640px) 50vw, 240px"
        className="object-cover"
      />
      {onSelect && (
        <span
          className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full border border-line-strong bg-cream opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100"
          aria-hidden
        >
          <Check className="size-3 text-ink" strokeWidth={2.5} />
        </span>
      )}
    </span>
  );

  if (!onSelect) return inner;

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className="group block w-full text-left disabled:pointer-events-none disabled:opacity-40"
    >
      {inner}
      <span className="mt-2 block text-caption text-muted">눌러서 고르기</span>
    </button>
  );
}
