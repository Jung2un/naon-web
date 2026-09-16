"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";

/**
 * 변환은 Edge Function에서 비동기로 돌고 웹은 상태만 받는다. — docs/배포.md §2
 *
 * jobs 테이블의 변경을 구독하다가 서버 컴포넌트를 다시 그리게 한다.
 * 상태를 클라이언트에 따로 들고 있지 않으므로 전역 상태 라이브러리가 필요 없다.
 */
export function JobsRealtime({ jobId }: { jobId?: string }) {
  const router = useRouter();

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const supabase = createClient();
    const channel = supabase
      .channel(jobId ? `job:${jobId}` : "jobs")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "jobs",
          ...(jobId ? { filter: `id=eq.${jobId}` } : {}),
        },
        () => router.refresh(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [router, jobId]);

  return null;
}
