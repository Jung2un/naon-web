export const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export type TopupInput = {
  user_id: string;
  request_id: string;
  credits: number;
  amount_krw: number;
  depositor: string;
  payment_reference: string;
  note: string;
};
export function parseTopup(body: Record<string, unknown>): TopupInput | null {
  const {
    user_id,
    request_id,
    credits,
    amount_krw,
    depositor,
    payment_reference,
  } = body;
  const note = body.note ?? "";
  if (
    typeof user_id !== "string" ||
    !UUID.test(user_id) ||
    typeof request_id !== "string" ||
    !UUID.test(request_id) ||
    typeof credits !== "number" ||
    !Number.isInteger(credits) ||
    credits < 1 ||
    credits > 100000 ||
    typeof amount_krw !== "number" ||
    !Number.isInteger(amount_krw) ||
    amount_krw < 1 ||
    amount_krw > 100000000 ||
    typeof depositor !== "string" ||
    !depositor.trim() ||
    depositor.trim().length > 80 ||
    typeof payment_reference !== "string" ||
    payment_reference.trim().length < 4 ||
    payment_reference.trim().length > 120 ||
    typeof note !== "string" ||
    note.trim().length > 300
  )
    return null;
  return {
    user_id,
    request_id,
    credits,
    amount_krw,
    depositor: depositor.trim(),
    payment_reference: payment_reference.trim().toLowerCase(),
    note: note.trim(),
  };
}

export function validBilling(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const s = value as Record<string, unknown>;
  if (
    typeof s.enabled !== "boolean" ||
    !Array.isArray(s.plans) ||
    s.plans.length > 6
  )
    return false;
  for (const [key, max] of [
    ["bank_name", 40],
    ["account_number", 60],
    ["account_holder", 80],
    ["instructions", 1000],
  ] as const) {
    if (
      typeof s[key] !== "string" ||
      s[key].length > max ||
      (s.enabled && key !== "instructions" && !s[key].trim())
    )
      return false;
  }
  if (s.enabled && s.plans.length === 0) return false;
  return s.plans.every(
    (p) =>
      p &&
      typeof p === "object" &&
      typeof p.name === "string" &&
      p.name.trim().length >= 1 &&
      p.name.length <= 40 &&
      Number.isInteger(p.credits) &&
      p.credits >= 1 &&
      p.credits <= 100000 &&
      Number.isInteger(p.price_krw) &&
      p.price_krw >= 1 &&
      p.price_krw <= 100000000,
  );
}
