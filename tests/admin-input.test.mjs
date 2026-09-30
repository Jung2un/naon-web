import assert from "node:assert/strict";
import test from "node:test";
import {
  parseTopup,
  validBilling,
} from "../supabase/functions/_shared/admin-input.ts";
const valid = {
  user_id: "50ec9fec-ffd6-43a9-b585-c89f14c3ddd1",
  request_id: "22222222-2222-4222-8222-222222222222",
  credits: 100,
  amount_krw: 10000,
  depositor: " 입금자 ",
  payment_reference: " BANK-1234 ",
  note: " 확인 ",
};
test("topups normalize reference and preserve numeric amounts", () => {
  assert.deepEqual(parseTopup(valid), {
    ...valid,
    depositor: "입금자",
    payment_reference: "bank-1234",
    note: "확인",
  });
});
test("reject forged, fractional, negative, zero, oversized and incomplete topups", () => {
  for (const patch of [
    { user_id: "bad" },
    { request_id: null },
    { credits: 0 },
    { credits: -1 },
    { credits: 1.5 },
    { credits: "100" },
    { credits: 100001 },
    { amount_krw: 0 },
    { amount_krw: Infinity },
    { amount_krw: 100000001 },
    { depositor: " " },
    { payment_reference: "x" },
    { note: "x".repeat(301) },
  ])
    assert.equal(
      parseTopup({ ...valid, ...patch }),
      null,
      JSON.stringify(patch),
    );
});
test("billing can stay unpublished but requires complete real settings before publication", () => {
  const draft = {
    enabled: false,
    bank_name: "",
    account_number: "",
    account_holder: "",
    instructions: "",
    plans: [],
  };
  assert.equal(validBilling(draft), true);
  assert.equal(validBilling({ ...draft, enabled: true }), false);
  const published = {
    ...draft,
    enabled: true,
    bank_name: "은행",
    account_number: "123-456",
    account_holder: "예금주",
    plans: [{ name: "기본", credits: 100, price_krw: 10000 }],
  };
  assert.equal(validBilling(published), true);
  for (const patch of [
    { credits: -1 },
    { credits: 0.5 },
    { price_krw: 0 },
    { price_krw: "1000" },
    { name: "" },
  ])
    assert.equal(
      validBilling({
        ...published,
        plans: [{ ...published.plans[0], ...patch }],
      }),
      false,
    );
  assert.equal(
    validBilling({ ...published, plans: Array(7).fill(published.plans[0]) }),
    false,
  );
});
