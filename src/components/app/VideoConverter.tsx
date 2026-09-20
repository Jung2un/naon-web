"use client";
import { LOOKS_ENABLED } from "@/features/looks/config";


import { GenerationProgress } from "./GenerationProgress";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Film, LoaderCircle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { invokeFunction } from "@/lib/supabase/functions";
import { humanError } from "@/lib/errors";
import type { CharacterListItem, LookListItem } from "@/types/models";

export function VideoConverter(
  { characters, looks, balance, available }: {
    characters: CharacterListItem[];
    looks: LookListItem[];
    balance: number;
    available: boolean;
  },
) {
  const router = useRouter();
  const [character, setCharacter] = useState(characters[0]?.id ?? "");
  const [look, setLook] = useState("default");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [duration, setDuration] = useState<number | null>(null);
  const [phase, setPhase] = useState<"idle" | "uploading" | "submitting">(
    "idle",
  );
  const [startedAt, setStartedAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const upload = useRef<{ id: string; path: string } | null>(null);
  const pending = phase !== "idle";
  const validDuration = duration !== null && Number.isFinite(duration) &&
    duration >= 3 && duration <= 10;
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);
  const selectFile = (value: File | undefined) => {
    setError(null);
    setFile(null);
    setPreview("");
    setDuration(null);
    upload.current = null;
    if (!value) return;
    if (value.type !== "video/mp4" || value.size > 50 * 1024 * 1024) {
      setError("MP4 파일을 50MB 이하로 올려 주세요.");
      return;
    }
    setFile(value);
    setPreview(URL.createObjectURL(value));
  };
  async function submit() {
    if (!file || !validDuration || pending || !available) return;
    setStartedAt(new Date().toISOString());
    setPhase("uploading");
    setError(null);
    try {
      const client = createClient();
      const { data: { user } } = await client.auth.getUser();
      if (!user) throw new Error("SESSION_EXPIRED");
      if (!upload.current) {
        const id = crypto.randomUUID();
        const path = `${user.id}/${id}/source.mp4`;
        const { error: uploadError } = await client.storage.from("videos")
          .upload(path, file, { contentType: "video/mp4", upsert: false });
        if (uploadError) throw new Error("VIDEO_UPLOAD_FAILED");
        upload.current = { id, path };
      }
      setPhase("submitting");
      const result = await invokeFunction<{ job_id: string }>(
        client,
        "create-video",
        {
          job_id: upload.current.id,
          source_path: upload.current.path,
          character_id: character,
          look_id: LOOKS_ENABLED && look !== "default" ? look : null,
        },
      );
      router.push(`/jobs/${result.job_id}`);
      router.refresh();
    } catch (e) {
      setError(humanError(e instanceof Error ? e.message : null));
      setPhase("idle");
    }
  }
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6 rounded-[20px] border border-line bg-surface p-5 sm:p-7">
        {!available && (
          <p
            role="status"
            className="rounded-[12px] bg-sunken p-4 text-sm text-body"
          >
            영상 변환 서비스를 준비하고 있어요. 연결이 완료되면 여기서 변환할 수
            있어요.
          </p>
        )}
        <div className="grid gap-2">
          <Label htmlFor="video-character">어떤 캐릭터로 바꿀까요?</Label>
          <Select
            id="video-character"
            value={character}
            disabled={pending}
            onValueChange={(v) => {
              setCharacter(v);
              setLook("default");
              upload.current = null;
            }}
            items={characters.map((c) => ({ value: c.id, label: c.name }))}
          />
        </div>
        {LOOKS_ENABLED && <div className="grid gap-2">
          <Label htmlFor="video-look">입힐 스타일</Label>
          <Select
            id="video-look"
            value={look}
            disabled={pending}
            onValueChange={(v) => {
              setLook(v);
              upload.current = null;
            }}
            items={[
              { value: "default", label: "캐릭터 기본 스타일" },
              ...looks.filter((l) =>
                l.character_id === character && l.status === "done"
              ).map((l) => ({ value: l.id, label: l.name })),
            ]}
          />
        </div>}
        <div>
          <Label htmlFor="source-video">변환할 영상</Label>
          <p id="video-help" className="mt-2 text-sm text-muted">
            혼자 나오는 3~10초 MP4 영상 · 최대 50MB
          </p>
          <label
            className="mt-3 flex min-h-36 cursor-pointer flex-col items-center justify-center gap-3 rounded-[16px] border border-dashed border-line-strong bg-cream p-5 focus-within:ring-2 focus-within:ring-primary"
            htmlFor="source-video"
          >
            <Upload className="size-6 text-muted" aria-hidden />
            <span className="text-sm">
              {file ? file.name : "영상 파일 선택"}
            </span>
            <input
              id="source-video"
              type="file"
              accept="video/mp4"
              aria-describedby="video-help"
              disabled={pending}
              className="sr-only"
              onChange={(e) => selectFile(e.target.files?.[0])}
            />
          </label>
        </div>
        {preview && (
          <div>
            <video
              key={preview}
              src={preview}
              controls
              playsInline
              preload="metadata"
              className="max-h-96 w-full rounded-[16px] bg-sunken"
              onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
              onError={() => {
                setDuration(null);
                setError(
                  "재생할 수 없는 파일이에요. 다른 MP4 영상을 골라 주세요.",
                );
              }}
            />
            <p className="mt-2 text-caption text-muted">
              {duration !== null
                ? (validDuration
                  ? `영상 길이 ${duration.toFixed(1)}초`
                  : "영상 길이를 3~10초로 맞춰 주세요.")
                : "영상 정보를 확인하고 있어요."}
            </p>
          </div>
        )}
        {pending && <GenerationProgress title={phase === "uploading" ? "영상 업로드 중" : "변환 요청 접수 중"} startedAt={startedAt} expectedSeconds={60} background={false} />}
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      </div>
      <aside className="h-fit rounded-[20px] border border-line bg-surface p-6 lg:sticky lg:top-8">
        <Film className="size-7 text-primary" aria-hidden />
        <h2 className="mt-4 text-section">내 움직임은 그대로</h2>
        <p className="mt-3 text-sm text-body">
          선택한 캐릭터의 모습으로 영상을 바꿔요. 완료되면 작업물에서 확인할 수
          있어요.
        </p>
        <dl className="my-6 space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">사용 크레딧</dt>
            <dd>1</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">남은 크레딧</dt>
            <dd>{balance}</dd>
          </div>
        </dl>
        <Button
          variant="primary"
          className="w-full"
          disabled={!available || !validDuration || !character || balance < 1 ||
            pending}
          onClick={submit}
        >
          {pending && <LoaderCircle className="motion-spin" aria-hidden />}
          {phase === "uploading"
            ? "영상을 올리고 있어요"
            : phase === "submitting"
            ? "변환을 요청하고 있어요"
            : "1크레딧으로 변환하기"}
        </Button>
        {balance < 1 && (
          <p className="mt-3 text-sm text-danger">
            크레딧이 부족해요. 충전 후 시작해 주세요.
          </p>
        )}
        <p className="mt-3 text-caption text-muted">
          영상과 캐릭터 이미지가 AI 변환 서비스로 전달돼요. 생성 실패 시 사용
          크레딧이 반환돼요.
        </p>
      </aside>
    </div>
  );
}
