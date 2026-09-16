import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * private 버킷 파일은 서버에서 signed URL(만료 1시간)을 만들어 내려준다.
 * 클라이언트에 버킷 경로를 그대로 노출하지 않는다. — CLAUDE.md 아키텍처 규칙 4
 *
 * 영상만 R2로 옮길 때 고쳐야 하는 곳이 여기 하나다. — docs/배포.md §6
 */
const ONE_HOUR = 60 * 60;

export type Bucket = "avatars" | "characters" | "looks" | "videos" | "presets";

export async function signedUrl(
  supabase: SupabaseClient<Database>,
  bucket: Bucket,
  path: string | null,
): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, ONE_HOUR);
  if (error) return null;
  return data.signedUrl;
}

export async function signedUrls(
  supabase: SupabaseClient<Database>,
  bucket: Bucket,
  paths: (string | null)[],
): Promise<(string | null)[]> {
  const real = paths.filter((p): p is string => Boolean(p));
  if (real.length === 0) return paths.map(() => null);

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrls(real, ONE_HOUR);
  if (error || !data) return paths.map(() => null);

  const byPath = new Map(data.map((d) => [d.path, d.signedUrl ?? null]));
  return paths.map((p) => (p ? (byPath.get(p) ?? null) : null));
}
