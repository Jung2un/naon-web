"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { invokeFunction } from "@/lib/supabase/functions";
import { humanError } from "@/lib/errors";
import { GenerationProgress } from "./GenerationProgress";

export function RetryVideoJob({ sourceUrl, characterId }: { sourceUrl: string | null; characterId: string }) {
  const router = useRouter();
  const busy = useRef(false);
  // Reuse this attempt after a lost response: create-video's job ID is idempotent.
  const attempt = useRef<{ id: string; path: string; uploaded: boolean } | null>(null);
  const [phase, setPhase] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  async function retry() {
    if (busy.current || !sourceUrl) return;
    busy.current = true;
    setStartedAt(new Date().toISOString());
    setPhase("원본 영상 준비 중");
    setError(null);
    try {
      const client = createClient();
      const { data: { user } } = await client.auth.getUser();
      if (!user) throw new Error("SESSION_EXPIRED");
      if (!attempt.current) {
        const id = crypto.randomUUID();
        attempt.current = { id, path: `${user.id}/${id}/source.mp4`, uploaded: false };
      }
      const current = attempt.current;
      if (!current.uploaded) {
        const response = await fetch(sourceUrl, { signal: AbortSignal.timeout(60000) });
        if (!response.ok) throw new Error("VIDEO_INVALID");
        const file = await response.blob();
        if (file.size > 50 * 1024 * 1024) throw new Error("VIDEO_INVALID");
        setPhase("원본 영상 업로드 중");
        const { error: uploadError } = await client.storage.from("videos").upload(current.path, file, { contentType: "video/mp4", upsert: false });
        // A prior upload acknowledgement may have been lost; do not overwrite an existing source.
        if (uploadError && uploadError.message !== "The resource already exists") throw new Error("VIDEO_UPLOAD_FAILED");
        current.uploaded = true;
      }
      setPhase("변환 요청 접수 중");
      const result = await invokeFunction<{ job_id: string }>(client, "create-video", {
        job_id: current.id, source_path: current.path, character_id: characterId, look_id: null,
      });
      router.push(`/jobs/${result.job_id}`);
      router.refresh();
    } catch (e) {
      setError(humanError(e instanceof Error ? e.message : null));
      setPhase(null);
      busy.current = false;
      router.refresh();
    }
  }
  return <div className="mt-4">
    <Button onClick={retry} disabled={Boolean(phase) || !sourceUrl}>{phase ?? "다시 시도하기"}</Button>
    <p className="mt-2 text-caption text-muted">원본 영상과 캐릭터 기본 모습으로 새 작업을 만들어요. 재시도에는 1크레딧이 사용돼요.</p>
    {!sourceUrl && <p className="mt-2 text-sm text-danger">원본 영상이 없어 다시 올려야 해요. <Link href="/jobs/new" className="underline">영상 다시 올리기</Link></p>}
    {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
    {phase && <GenerationProgress title={phase} startedAt={startedAt} expectedSeconds={60} background={false} />}
  </div>;
}
