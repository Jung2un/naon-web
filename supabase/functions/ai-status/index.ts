import { fail, ok, preflight } from "../_shared/http.ts";
import { callerId } from "../_shared/supabase.ts";
import { geminiConfig } from "../_shared/gemini.ts";
Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== "POST") return new Response(null, { status: 405 });
  if (!await callerId(req)) return fail(req, 401, "SESSION_EXPIRED");
  return ok(req, {
    image: Boolean(geminiConfig()),
    video: Boolean(Deno.env.get("FAL_KEY") && Deno.env.get("WEBHOOK_SECRET")),
  });
});
