"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { humanError } from "@/lib/errors";
export async function deleteOwnedItem(kind: "job" | "character", id: string) {
  if (!isSupabaseConfigured)
    return { error: "미리보기에서는 삭제할 수 없어요." };
  if (!["job", "character"].includes(kind) || !/^[0-9a-f-]{36}$/i.test(id))
    return { error: humanError("DELETE_NOT_FOUND") };
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return { error: humanError("SESSION_EXPIRED") };
  const { error } = await client.rpc("delete_owned_item", {
    p_kind: kind,
    p_id: id,
  });
  if (error) return { error: humanError(error.message) };
  revalidatePath("/dashboard");
  revalidatePath("/characters", "layout");
  revalidatePath("/jobs", "layout");
  return { success: true };
}
