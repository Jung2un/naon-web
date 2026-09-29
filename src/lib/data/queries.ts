import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { signedUrl, signedUrls } from "@/lib/storage";
import { catalogUrl, toneVariantUrl } from "@/lib/catalog";
import type {
  CharacterBuild,
  CharacterDetail,
  CharacterImage,
  CharacterImageWithUrl,
  CharacterListItem,
  CharacterOption,
  CharacterOptionWithUrl,
  JobDetail,
  JobListItem,
  LedgerEntry,
  LookListItem,
  OptionKind,
  Preset,
  PresetSlot,
  PresetWithUrl,
  Profile,
} from "@/types/models";
import { asTraits } from "@/types/models";
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
      option_names: {},
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
    option_names: await optionNames(character.tone_id, character.traits),
    looks,
    recent_jobs: jobs,
  };
}

/** 톤·속성 id를 사람이 읽는 이름으로 바꾼다. id는 화면에 내보내지 않는다. */
async function optionNames(
  toneId: string | null,
  traits: unknown,
): Promise<Partial<Record<OptionKind, string>>> {
  const selected = asTraits(traits);
  const ids = [toneId, ...Object.values(selected)].filter(
    (id): id is string => Boolean(id),
  );
  if (ids.length === 0) return {};

  const supabase = await createClient();
  const { data } = await supabase
    .from("character_options")
    .select("id, kind, name")
    .in("id", ids);

  const out: Partial<Record<OptionKind, string>> = {};
  for (const option of data ?? []) out[option.kind] = option.name;
  return out;
}

/** 톤·속성 카탈로그. 갈래별로 묶어서 돌려준다 — 화면이 갈래마다 한 줄씩 그린다. */
export async function getCharacterOptions(): Promise<
  Record<OptionKind, CharacterOptionWithUrl[]>
> {
  const empty: Record<OptionKind, CharacterOptionWithUrl[]> = {
    tone: [],
    gender: [],
    age: [],
    hair: [],
    hair_color: [],
    body: [],
    vibe: [],
    face: [],
    makeup: [],
  };

  const rows: CharacterOptionWithUrl[] = await (async () => {
    if (!isSupabaseConfigured) {
      return fixtures.fixtureCharacterOptions.map((o) => ({
        ...o,
        thumbnail_url: catalogUrl(o.thumbnail_path),
      }));
    }

    const supabase = await createClient();
    const { data } = await supabase
      .from("character_options")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");
    if (!data) return [];

    // 썸네일은 톤만 쓴다. 속성은 글자 칩이라 이미지가 없어도 화면이 완성된다.
    const urls = await catalogOrSigned(
      supabase,
      data.map((o: CharacterOption) => o.thumbnail_path),
    );
    return data.map((o: CharacterOption, i: number) => ({
      ...o,
      thumbnail_url: urls[i],
    }));
  })();

  // 톤마다 성별별 사진을 붙인다. 화면이 성별을 바꿀 때 서버를 다시 부르지 않게 한 번에 내려준다.
  const genderIds = rows.filter((o) => o.kind === "gender").map((o) => o.id);
  const withVariants = rows.map((o) =>
    o.kind === "tone"
      ? {
          ...o,
          thumbnail_variants: Object.fromEntries(
            genderIds.map((id) => [id, toneVariantUrl(o.thumbnail_path, id)]),
          ),
        }
      : o,
  );

  return withVariants.reduce((acc, option) => {
    acc[option.kind].push(option);
    return acc;
  }, empty);
}

/**
 * 캐릭터 스튜디오(2~4단계)가 읽는 것. 후보·수정본·3방향이 전부 여기 들어 있다.
 * 완성된 캐릭터에는 쓰지 않는다 — 그건 `getCharacter`가 그린다.
 */
export async function getCharacterBuild(
  id: string,
): Promise<CharacterBuild | null> {
  const options = await getCharacterOptions();

  if (!isSupabaseConfigured) {
    const character = fixtures.fixtureCharacters.find((c) => c.id === id);
    if (!character) return null;
    return { ...character, base_image_url: null, images: [], options };
  }

  const supabase = await createClient();
  const { data: character } = await supabase
    .from("characters")
    .select("*")
    .eq("id", id)
    .single();
  if (!character) return null;

  const { data: rows } = await supabase
    .from("character_images")
    .select("*")
    .eq("character_id", id)
    .order("created_at", { ascending: true });

  const images = rows ?? [];
  const urls = await signedUrls(
    supabase,
    "characters",
    images.map((r: CharacterImage) => r.image_path),
  );

  return {
    ...character,
    base_image_url: await signedUrl(supabase, "characters", character.base_image_path),
    images: images.map(
      (row: CharacterImage, i: number): CharacterImageWithUrl => ({
        ...row,
        image_url: urls[i],
      }),
    ),
    options,
  };
}

/**
 * 톤·프리셋 썸네일. 앱에 실린 카탈로그 그림이 있으면 그걸 쓰고(`src/lib/catalog.ts`),
 * 없는 경로만 presets 버킷에서 서명한다. 전부 카탈로그면 스토리지를 부르지 않는다.
 */
async function catalogOrSigned(
  supabase: Awaited<ReturnType<typeof createClient>>,
  paths: (string | null)[],
): Promise<(string | null)[]> {
  const fixed = paths.map(catalogUrl);
  const signed = await signedUrls(
    supabase,
    "presets",
    paths.map((p, i) => (fixed[i] ? null : p)),
  );
  return fixed.map((url, i) => url ?? signed[i]);
}

export async function getPresets(): Promise<Record<PresetSlot, PresetWithUrl[]>> {
  const empty: Record<PresetSlot, PresetWithUrl[]> = {
    hair: [],
    top: [],
    bottom: [],
    scene: [],
    outfit: [],
  };

  const rows: PresetWithUrl[] = await (async () => {
    if (!isSupabaseConfigured) {
      return fixtures.fixturePresets.map((p) => ({
        ...p,
        thumbnail_url: catalogUrl(p.thumbnail_path),
      }));
    }

    const supabase = await createClient();
    const { data } = await supabase
      .from("presets")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");
    if (!data) return [];

    const urls = await catalogOrSigned(
      supabase,
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
        // 코디 룩은 머리를 안 고른다 — 캐릭터의 머리를 그대로 쓴다
        hair: look.hair_preset_id ? (nameById.get(look.hair_preset_id) ?? "") : "",
        // 코디를 고른 룩은 상의·하의가 비어 있다
        top: look.top_preset_id ? (nameById.get(look.top_preset_id) ?? "") : "",
        bottom: look.bottom_preset_id ? (nameById.get(look.bottom_preset_id) ?? "") : "",
        // 장소를 안 고른 룩은 찍은 배경 그대로다
        scene: look.scene_preset_id ? (nameById.get(look.scene_preset_id) ?? "") : "",
        outfit: look.outfit_preset_id ? (nameById.get(look.outfit_preset_id) ?? "") : "",
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

/**
 * 지금 돌고 있는 변환 개수(대기 + 처리 중). 모바일 상단 앱바가 쓴다.
 *
 * 목록(`getJobs`)을 부르지 않는다 — 썸네일 signed URL까지 따라와서 화면마다 그 값을 다시 만든다.
 * 앱바가 알아야 하는 건 "돌고 있는 게 몇 개인가" 하나뿐이라 개수만 센다.
 */
export const getActiveJobCount = cache(async (): Promise<number> => {
  if (!isSupabaseConfigured) {
    return fixtures.fixtureJobs.filter(
      (j) => j.status === "queued" || j.status === "processing",
    ).length;
  }

  const supabase = await createClient();
  const { count } = await supabase
    .from("jobs")
    .select("id", { count: "exact", head: true })
    .in("status", ["queued", "processing"]);

  return count ?? 0;
});

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
