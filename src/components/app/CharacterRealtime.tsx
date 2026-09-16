"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";

/**
 * 캐릭터 만들기는 Edge Function에서 비동기로 돌고 웹은 상태만 받는다.
 * 후보 4장이면 이미지 행이 네 번 바뀌고, 배치가 끝나면 캐릭터 행이 한 번 더 바뀐다.
 * 둘 다 구독해서 서버 컴포넌트를 다시 그리게 한다. — CLAUDE.md 아키텍처 규칙 1
 */
export function CharacterRealtime({ characterId }: { characterId: string }) {
  const router = useRouter();

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`character:${characterId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "characters",
          filter: `id=eq.${characterId}`,
        },
        () => router.refresh(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "character_images",
          filter: `character_id=eq.${characterId}`,
        },
        () => router.refresh(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [router, characterId]);

  return null;
}
