import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { invokeFunction } from "@/lib/supabase/functions";
import { isSupabaseConfigured } from "@/lib/env";

export async function adminRead<T>(
  action: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  if (!isSupabaseConfigured) notFound();
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect("/login?next=/admin");
  try {
    return await invokeFunction<T>(client, "admin-backoffice", {
      ...args,
      action,
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "ADMIN_FORBIDDEN" || code === "ADMIN_USER_NOT_FOUND")
      notFound();
    if (code === "SESSION_EXPIRED") redirect("/login?next=/admin");
    throw error;
  }
}

// 메뉴 표시만 실패 시 감춘다. 관리 페이지의 실패는 빈 데이터로 위장하지 않는다.
export const hasAdminAccess = cache(async () => {
  if (!isSupabaseConfigured) return false;
  try {
    const client = await createClient();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) return false;
    const data = await invokeFunction<{ is_admin: boolean }>(
      client,
      "admin-backoffice",
      { action: "access" },
    );
    return data.is_admin === true;
  } catch {
    return false;
  }
});

export function pageNumber(value: string | string[] | undefined) {
  const n = typeof value === "string" ? Number(value) : 1;
  return Number.isSafeInteger(n) && n > 0 ? Math.min(n, 100000) : 1;
}
export function textParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value.slice(0, 120) : "";
}
