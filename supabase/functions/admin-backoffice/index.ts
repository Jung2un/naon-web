import { adminClient, callerId } from "../_shared/supabase.ts";
import { preflight, ok, fail, type ErrorCode } from "../_shared/http.ts";
import { parseTopup, validBilling, UUID } from "../_shared/admin-input.ts";

const reads = new Set(["overview", "users", "user", "ledger", "topups"]);
Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== "POST") return fail(req, 405, "ADMIN_INVALID_INPUT");
  try {
    const actor = await callerId(req);
    if (!actor) return fail(req, 401, "SESSION_EXPIRED");
    const admin = adminClient();
    const { data: membership, error: membershipError } = await admin
      .from("backoffice_admins")
      .select("user_id")
      .eq("user_id", actor)
      .maybeSingle();
    if (membershipError) throw membershipError;
    if (!membership) return fail(req, 403, "ADMIN_FORBIDDEN");

    let body: Record<string, unknown>;
    try {
      const payload = await req.json();
      if (!payload || typeof payload !== "object" || Array.isArray(payload))
        throw new Error();
      body = payload;
    } catch {
      return fail(req, 400, "ADMIN_INVALID_INPUT");
    }
    if (body.action === "access") return ok(req, { is_admin: true });
    if (body.action === "billing" || body.action === "save_billing") {
      if (body.action === "save_billing" && !validBilling(body.settings))
        return fail(req, 400, "ADMIN_INVALID_INPUT");
      const { data, error } = await admin.rpc("admin_billing", {
        p_actor_id: actor,
        p_settings: body.action === "save_billing" ? body.settings : null,
      });
      if (error) throw error;
      return ok(req, data);
    }
    if (body.action === "topup") {
      const input = parseTopup(body);
      if (!input) return fail(req, 400, "ADMIN_INVALID_INPUT");
      const { data, error } = await admin.rpc("admin_top_up_credits", {
        p_actor_id: actor,
        p_user_id: input.user_id,
        p_request_id: input.request_id,
        p_credits: input.credits,
        p_amount_krw: input.amount_krw,
        p_depositor: input.depositor,
        p_payment_reference: input.payment_reference,
        p_note: input.note,
      });
      if (error) throw error;
      return ok(req, data);
    }
    if (typeof body.action !== "string" || !reads.has(body.action))
      return fail(req, 400, "ADMIN_INVALID_INPUT");
    if (
      body.user_id != null &&
      (typeof body.user_id !== "string" || !UUID.test(body.user_id))
    )
      return fail(req, 400, "ADMIN_INVALID_INPUT");
    if (["user", "ledger"].includes(body.action) && !body.user_id)
      return fail(req, 400, "ADMIN_INVALID_INPUT");
    const { data, error } = await admin.rpc("admin_backoffice_read", {
      p_actor_id: actor,
      p_operation: body.action,
      p_search:
        typeof body.search === "string" ? body.search.slice(0, 120) : "",
      p_user_id: body.user_id ?? null,
      p_page:
        typeof body.page === "number" && Number.isInteger(body.page)
          ? Math.max(1, Math.min(body.page, 100000))
          : 1,
      p_filter:
        typeof body.filter === "string" &&
        ["all", "empty", "used", "charged", "refunded"].includes(body.filter)
          ? body.filter
          : "all",
    });
    if (error) throw error;
    return ok(req, data);
  } catch (error) {
    const message =
      error && typeof error === "object" && "message" in error
        ? String(error.message)
        : "";
    const allowed: ErrorCode[] = [
      "ADMIN_FORBIDDEN",
      "ADMIN_INVALID_INPUT",
      "ADMIN_REQUEST_CONFLICT",
      "ADMIN_DUPLICATE_PAYMENT",
      "ADMIN_USER_NOT_FOUND",
    ];
    const code = allowed.find((c) => message === c);
    if (code)
      return fail(
        req,
        code === "ADMIN_FORBIDDEN"
          ? 403
          : code === "ADMIN_USER_NOT_FOUND"
            ? 404
            : 409,
        code,
      );
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "23505"
    )
      return fail(req, 409, "ADMIN_DUPLICATE_PAYMENT");
    console.error("Backoffice request failed", { message });
    return fail(req, 500, "ADMIN_UNAVAILABLE");
  }
});
