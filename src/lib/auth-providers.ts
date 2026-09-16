import type { Provider } from "@supabase/supabase-js";

/**
 * 인증은 OAuth 2.0만. 비밀번호 로그인을 만들지 않는다. — CLAUDE.md 아키텍처 규칙 6
 * 공급자는 이 배열 하나에서 늘어난다.
 *
 * status
 *   ready     — Supabase Authentication → Providers에서 켜져 있고 바로 로그인된다
 *   preparing — 버튼은 보이지만 아직 Supabase에 공급자가 안 켜져 있다.
 *               켠 뒤 이 한 단어만 "ready"로 바꾸면 동작한다.
 */
export type ProviderStatus = "ready" | "preparing";

export type OAuthProvider = {
  id: Provider;
  label: string;
  /** DESIGN.md §6 — 색 규칙이 면제되는 유일한 요소다. 각 사 가이드라인을 따른다. */
  brand: {
    background: string;
    color: string;
    border?: string;
    /** 눌렀을 때 배경. 각 사 가이드라인의 pressed 색. */
    hover: string;
  };
  status: ProviderStatus;
  /** 준비 중일 때 버튼 아래에 붙는 한 줄. */
  note?: string;
  scopes?: string;
};

export const OAUTH_PROVIDERS: OAuthProvider[] = [
  {
    id: "google",
    label: "Google로 계속하기",
    brand: {
      background: "#ffffff",
      color: "#3c4043",
      border: "1px solid #dadce0",
      hover: "#f8f9fa",
    },
    status: "ready",
  },
  {
    id: "kakao",
    label: "카카오로 계속하기",
    brand: {
      background: "#FEE500",
      color: "rgba(0,0,0,0.85)",
      hover: "#F0D800",
    },
    status: "preparing",
    note: "카카오 로그인은 곧 열려요.",
  },
];

export const READY_PROVIDERS = OAUTH_PROVIDERS.filter(
  (p) => p.status === "ready",
);
