"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { invokeFunction } from "@/lib/supabase/functions";
import { humanError } from "@/lib/errors";
import { isSupabaseConfigured } from "@/lib/env";
import type { Topup, BillingSettings } from "@/lib/admin/types";

export async function topUpCredits(
  input: Record<string, unknown>,
): Promise<{ data?: Topup; error?: string; retryable?: boolean }> {
  if (!isSupabaseConfigured) return { error: humanError("ADMIN_UNAVAILABLE") };
  try {
    const client = await createClient();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) return { error: humanError("SESSION_EXPIRED") };
    const data = await invokeFunction<Topup>(client, "admin-backoffice", {
      ...input,
      action: "topup",
    });
    revalidatePath("/admin", "layout");
    revalidatePath("/dashboard");
    revalidatePath("/credits");
    return { data };
  } catch (error) {
    const code = error instanceof Error ? error.message : "ADMIN_UNAVAILABLE";
    return {
      error: humanError(code),
      retryable: ![
        "ADMIN_INVALID_INPUT",
        "ADMIN_REQUEST_CONFLICT",
        "ADMIN_DUPLICATE_PAYMENT",
        "ADMIN_USER_NOT_FOUND",
        "ADMIN_FORBIDDEN",
      ].includes(code),
    };
  }
}

export async function saveBillingSettings(
  input: BillingSettings,
): Promise<{ success?: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { error: humanError("ADMIN_UNAVAILABLE") };
  try {
    const client = await createClient();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) return { error: humanError("SESSION_EXPIRED") };
    await invokeFunction(client, "admin-backoffice", {
      action: "save_billing",
      settings: input,
    });
    revalidatePath("/admin/settings");
    revalidatePath("/credits");
    return { success: true };
  } catch (error) {
    return {
      error: humanError(
        error instanceof Error ? error.message : "ADMIN_UNAVAILABLE",
      ),
    };
  }
}
