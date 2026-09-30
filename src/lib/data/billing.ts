import "server-only";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { BillingSettings } from "@/lib/admin/types";
export async function getPublicBilling(): Promise<BillingSettings | null> {
  if (!isSupabaseConfigured) return null;
  const client = await createClient();
  const { data, error } = await client.rpc("get_public_billing");
  if (error)
    throw new Error(
      "충전 안내를 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.",
    );
  return data as BillingSettings | null;
}
