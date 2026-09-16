"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";
import { OAUTH_PROVIDERS, type OAuthProvider } from "@/lib/auth-providers";
import { callbackUrl } from "@/lib/site-url";
import { OAuthButton } from "./OAuthButton";

export function OAuthButtons({ next }: { next: string }) {
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signIn(provider: OAuthProvider) {
    if (!isSupabaseConfigured) {
      setError("아직 로그인 서버가 연결되지 않았어요.");
      return;
    }
    setPending(provider.id);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: provider.id,
      options: {
        // 고정 운영 URL로 돌아온다. Supabase Redirect URLs에 한 줄만 등록하면 된다.
        redirectTo: callbackUrl(next),
        ...(provider.scopes ? { scopes: provider.scopes } : {}),
      },
    });

    if (signInError) {
      setPending(null);
      setError("로그인에 실패했어요. 잠시 뒤 다시 시도해 주세요.");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {OAUTH_PROVIDERS.map((provider) => (
        <OAuthButton
          key={provider.id}
          provider={provider}
          pending={pending === provider.id}
          disabled={pending !== null && pending !== provider.id}
          onClick={signIn}
        />
      ))}

      {error && (
        <p role="alert" className="text-caption text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
