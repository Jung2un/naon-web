import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { signedUrl, signedUrls } from "@/lib/storage";
import type {
  CharacterDetail,
  CharacterListItem,
  JobDetail,
  JobListItem,
  LedgerEntry,
  LookListItem,
  Preset,
  PresetSlot,
  PresetWithUrl,
  Profile,
} from "@/types/models";
import * as fixtures from "./fixtures";

/**
 * 데이터 읽기는 전부 서버 컴포넌트에서. — CLAUDE.md 아키텍처 규칙 1
 * 클라이언트가 직접 INSERT 하지 않으므로 여기엔 SELECT만 있다.
 */

/** 한 요청 안에서 프로필을 여러 번 읽어도 쿼리는 한 번만 나간다. */
export const getProfile = cache(async (): Promise<Profile | null> => {
  if (!isSupabaseConfigured) return fixtures.fixtureProfile;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return data ?? null;
});

export async function getCharacters(): Promise<CharacterListItem[]> {
  if (!isSupabaseConfigured) return fixtures.fixtureCharacters;

  const supabase = await createClient();
  const { data } = await supabase
    .from("characters")
    .select("*, looks(count), jobs(count)")
    .order("created_at", { ascending: false });

  if (!data) return [];

  const urls = await signedUrls(
    supabase,
    "characters",
    data.map((c) => c.thumbnail_path),
  );

  return data.map((row, i) => {
    const { looks, jobs, ...character } = row as typeof row & {
      looks: { count: number }[];
      jobs: { count: number }[];
    };
    return {
      ...character,
      thumbnail_url: urls[i],
      look_count: looks?.[0]?.count ?? 0,
      job_count: jobs?.[0]?.count ?? 0,
    };
  });
}

export async function getCharacter(id: string): Promise<CharacterDetail | null> {
  if (!isSupabaseConfigured) {
    const character = fixtures.fixtureCharacters.find((c) => c.id === id);
    if (!character) return null;
    return {
      ...character,
      refs: [],
      looks: fixtures.fixtureLooks.filter((l) => l.character_id === id),
      recent_jobs: fixtures.fixtureJobs.filter((j) => j.character_id === id).slice(0, 4),
    };
  }

  const supabase = await createClient();
  const { data: character } = await supabase
    .from("characters")
    .select("*")
    .eq("id", id)
    .single();
  if (!character) return null;

  const [{ data: refs }, looks, jobs] = await Promise.all([
    supabase
      .from("character_refs")
      .select("*")
      .eq("character_id", id),
    getLooks(id),
    getJobs({ characterId: id, limit: 4 }),
  ]);

  const refRows = refs ?? [];
  const refUrls = await signedUrls(
    supabase,
    "characters",
    refRows.map((r) => r.image_path),
  );

  return {
    ...character,
    thumbnail_url: await signedUrl(supabase, "characters", character.thumbnail_path),
    refs: refRows.map((r, i) => ({ ...r, image_url: refUrls[i] })),
    looks,
    recent_jobs: jobs,
  };
}

export async function getPresets(): Promise<Record<PresetSlot, PresetWithUrl[]>> {
  const empty: Record<PresetSlot, PresetWithUrl[]> = {
    hair: [],
    top: [],
    bottom: [],
    scene: [],
  };

  const rows: PresetWithUrl[] = await (async () => {
    if (!isSupabaseConfigured) return fixtures.fixturePresets;

    const supabase = await createClient();
    const { data } = await supabase
      .from("presets")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");
    if (!data) return [];

    const urls = await signedUrls(
      supabase,
      "presets",
      data.map((p: Preset) => p.thumbnail_path),
    );
    return data.map((p: Preset, i: number) => ({ ...p, thumbnail_url: urls[i] }));
  })();

  return rows.reduce((acc, preset) => {
    acc[preset.slot].push(preset);
    return acc;
  }, empty);
}

export async function getLooks(characterId?: string): Promise<LookListItem[]> {
  if (!isSupabaseConfigured) {
    return characterId
      ? fixtures.fixtureLooks.filter((l) => l.character_id === characterId)
      : fixtures.fixtureLooks;
  }

  const supabase = await createClient();
  let query = supabase
    .from("looks")
    .select("*, characters(name)")
    .order("created_at", { ascending: false });
  if (characterId) query = query.eq("character_id", characterId);

  const { data } = await query;
  if (!data) return [];

  const urls = await signedUrls(
    supabase,
    "looks",
    data.map((l) => l.thumbnail_path),
  );

  // 프리셋 이름은 한 번만 읽어 붙인다
  const { data: presets } = await supabase.from("presets").select("id, name, slot");
  const nameById = new Map((presets ?? []).map((p) => [p.id, p.name]));

  return data.map((row, i) => {
    const { characters, ...look } = row as typeof row & {
      characters: { name: string } | null;
    };
    return {
      ...look,
      thumbnail_url: urls[i],
      character_name: characters?.name ?? "",
      preset_names: {
        hair: nameById.get(look.hair_preset_id) ?? "",
        top: nameById.get(look.top_preset_id) ?? "",
        bottom: nameById.get(look.bottom_preset_id) ?? "",
        scene: nameById.get(look.scene_preset_id) ?? "",
      },
    };
  });
}

export async function getJobs(
  options: { characterId?: string; limit?: number } = {},
): Promise<JobListItem[]> {
  const { characterId, limit } = options;

  if (!isSupabaseConfigured) {
    let rows = fixtures.fixtureJobs;
    if (characterId) rows = rows.filter((j) => j.character_id === characterId);
    return limit ? rows.slice(0, limit) : rows;
  }

  const supabase = await createClient();
  let query = supabase
    .from("jobs")
    .select("*, characters(name), looks(name)")
    .order("created_at", { ascending: false });
  if (characterId) query = query.eq("character_id", characterId);
  if (limit) query = query.limit(limit);

  const { data } = await query;
  if (!data) return [];

  const urls = await signedUrls(
    supabase,
    "videos",
    data.map((j) => j.thumbnail_path),
  );

  return data.map((row, i) => {
    const { characters, looks, ...job } = row as typeof row & {
      characters: { name: string } | null;
      looks: { name: string } | null;
    };
    return {
      ...job,
      thumbnail_url: urls[i],
      character_name: characters?.name ?? "",
      look_name: looks?.name ?? null,
    };
  });
}

export async function getJob(id: string): Promise<JobDetail | null> {
  if (!isSupabaseConfigured) {
    const job = fixtures.fixtureJobs.find((j) => j.id === id);
    if (!job) return null;
    return { ...job, result_video_url: null, source_video_url: null };
  }

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("jobs")
    .select("*, characters(name), looks(name)")
    .eq("id", id)
    .single();
  if (!row) return null;

  const { characters, looks, ...job } = row as typeof row & {
    characters: { name: string } | null;
    looks: { name: string } | null;
  };

  const [thumbnail_url, result_video_url, source_video_url] = await Promise.all([
    signedUrl(supabase, "videos", job.thumbnail_path),
    signedUrl(supabase, "videos", job.result_video_path),
    signedUrl(supabase, "videos", job.source_video_path),
  ]);

  return {
    ...job,
    thumbnail_url,
    result_video_url,
    source_video_url,
    character_name: characters?.name ?? "",
    look_name: looks?.name ?? null,
  };
}

export async function getLedger(): Promise<LedgerEntry[]> {
  if (!isSupabaseConfigured) return fixtures.fixtureLedger;

  const supabase = await createClient();
  const { data } = await supabase
    .from("credit_ledger")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return data ?? [];
}
