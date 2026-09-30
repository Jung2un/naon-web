export type AdminUser = {
  id: string;
  email: string | null;
  display_name: string | null;
  credits: number;
  created_at: string;
  last_sign_in_at: string | null;
  is_admin: boolean;
};
export type UserDetail = AdminUser & {
  used_credits: number;
  purchased_credits: number;
  refunded_credits: number;
  characters: number;
  looks: number;
  jobs: number;
};
export type Topup = {
  request_id: string;
  user_id: string | null;
  user_email: string;
  actor_email: string;
  credits: number;
  amount_krw: number;
  depositor: string;
  payment_reference: string;
  note: string;
  balance_after: number;
  created_at: string;
};
export type AdminLedger = {
  id: string;
  delta: number;
  balance_after: number;
  reason: string;
  memo: string | null;
  created_at: string;
};
export type PageResult<T> = { items: T[]; total: number; page: number };
export type Overview = {
  users: number;
  new_users: number;
  outstanding_credits: number;
  used_credits: number;
  topup_credits: number;
  deposit_krw: number;
  daily: { day: string; used: number; charged: number }[];
};
export type CreditPlan = { name: string; credits: number; price_krw: number };
export type BillingSettings = {
  enabled: boolean;
  bank_name: string;
  account_number: string;
  account_holder: string;
  instructions: string;
  plans: CreditPlan[];
};
