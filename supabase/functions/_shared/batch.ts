/**
 * 배치 한 판을 배경에서 채운다. — docs/기획서.md §5
 *
 * 후보 4장이면 행 네 개를 만들어 두고 여기서 네 장을 만들어 꽂는다.
 * 함수는 행만 만들고 **바로 응답한다** — 30초~2분을 기다리게 하지 않는다.
 * 화면은 Realtime으로 행이 바뀌는 걸 본다.
 *
 * 배치가 끝났는지, 끝났다면 캐릭터를 어디로 옮기고 환불할지는
 * SQL 함수 finish_character_batch가 정한다. 여기서 판단하지 않는다.
 */
import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { refund } from "./supabase.ts";
import {
  generateImage,
  GenerationError,
  toSourceImage,
  type GeminiConfig,
  type SourceImage,
} from "./gemini.ts";

/** Supabase Edge Runtime의 배경 작업. 응답을 보낸 뒤에도 계속 돈다. */
declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void } | undefined;

export type BatchKind = "candidate" | "refined" | "view";

/** 배치별 비용과 환불 사유. 후보 1 · 수정 1 · 3방향 2 — 기획서 §4 */
const REFUND: Record<BatchKind, { amount: number; reason: string }> = {
  candidate: { amount: 1, reason: "character_draft_refund" },
  refined: { amount: 1, reason: "character_edit_refund" },
  view: { amount: 2, reason: "character_refund" },
};

export type BatchRow = { id: string; prompt: string };

/** 응답을 보낸 뒤에 이어서 돌린다. 런타임이 없으면(로컬 등) 그냥 기다린다. */
export function inBackground(promise: Promise<unknown>): void {
  if (typeof EdgeRuntime !== "undefined" && EdgeRuntime?.waitUntil) {
    EdgeRuntime.waitUntil(promise);
    return;
  }
  void promise;
}

export async function runImageBatch(
  admin: SupabaseClient,
  config: GeminiConfig,
  args: {
    userId: string;
    characterId: string;
    kind: BatchKind;
    round: number;
    rows: BatchRow[];
    /** 수정·각도의 입력 이미지. 한 번만 내려받아 배치 전체가 나눠 쓴다. */
    sourcePath?: string | null;
  },
): Promise<void> {
  const { userId, characterId, kind, round, rows, sourcePath } = args;

  let source: SourceImage | undefined;
  if (sourcePath) {
    try {
      const { data, error } = await admin.storage.from("characters").download(sourcePath);
      if (error || !data) throw error ?? new Error("입력 이미지를 못 읽었습니다");
      source = toSourceImage(await data.arrayBuffer(), data.type || "image/jpeg");
    } catch (e) {
      console.error("입력 이미지 준비 실패", { characterId, sourcePath, e });
      // 입력이 없으면 어느 장도 못 만든다. 전부 실패로 두고 배치를 닫는다.
      await Promise.all(
        rows.map((row) => markFailed(admin, row.id, "UPSTREAM_ERROR")),
      );
      await closeBatch(admin, { userId, characterId, kind, round });
      return;
    }
  }

  await Promise.all(
    rows.map(async (row) => {
      try {
        const image = await generateImage(config, { prompt: row.prompt, image: source });
        const path = `${userId}/${characterId}/${row.id}.${extensionOf(image.contentType)}`;

        const { error: uploadError } = await admin.storage
          .from("characters")
          .upload(path, image.bytes, {
            contentType: image.contentType,
            upsert: true,
          });
        if (uploadError) throw uploadError;

        const { error } = await admin
          .from("character_images")
          .update({
            status: "done",
            image_path: path,
            error_code: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", row.id);
        if (error) throw error;
      } catch (e) {
        const code = e instanceof GenerationError ? e.code : "UPSTREAM_ERROR";
        console.error("이미지 생성 실패", { image: row.id, code, e });
        await markFailed(admin, row.id, code);
      }
    }),
  );

  await closeBatch(admin, { userId, characterId, kind, round });
}

async function markFailed(
  admin: SupabaseClient,
  imageId: string,
  code: string,
): Promise<void> {
  const { error } = await admin
    .from("character_images")
    .update({ status: "failed", error_code: code, updated_at: new Date().toISOString() })
    .eq("id", imageId);
  if (error) console.error("실패 표시 실패", { image: imageId, error });
}

/**
 * 배치를 닫는다. 상태 전이가 조건부라 두 번 불러도 한 번만 이긴다 —
 * 진 쪽은 'already'를 받고 환불하지 않는다.
 */
async function closeBatch(
  admin: SupabaseClient,
  args: { userId: string; characterId: string; kind: BatchKind; round: number },
): Promise<void> {
  const { data: outcome, error } = await admin.rpc("finish_character_batch", {
    p_character_id: args.characterId,
    p_kind: args.kind,
    p_round: args.round,
  });
  if (error) {
    console.error("배치 마무리 실패", { characterId: args.characterId, error });
    return;
  }

  if (outcome === "failed") {
    const { amount, reason } = REFUND[args.kind];
    await refund(admin, args.userId, amount, reason, `character:${args.characterId}`);
  }
}

export function extensionOf(contentType: string): string {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  return "jpg";
}
