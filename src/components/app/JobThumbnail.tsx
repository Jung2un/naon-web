"use client";
import Image from "next/image";
import { useState } from "react";
import { Film, Play, LoaderCircle, CircleAlert } from "lucide-react";
import type { JobStatus } from "@/types/models";
export function JobThumbnail({
  src,
  isFallback,
  status,
  compact = false,
}: {
  src: string | null;
  isFallback: boolean;
  status: JobStatus;
  compact?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const working = status === "queued" || status === "processing";
  const Icon = working
    ? LoaderCircle
    : status === "failed"
      ? CircleAlert
      : Play;
  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-br from-primary-soft via-cream to-sunken" />
      {src && !failed ? (
        <Image
          src={src}
          onError={() => setFailed(true)}
          alt=""
          fill
          sizes={
            compact
              ? "96px"
              : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
          }
          className="object-cover transition-transform duration-300 motion-safe:group-hover:scale-[1.03] motion-reduce:transition-none"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 text-center break-keep text-muted">
          <Film
            className={compact ? "hidden" : "size-9 opacity-50"}
            aria-hidden
          />
          <p className={compact ? "sr-only" : "text-sm"}>
            {working
              ? "영상을 만들고 있어요"
              : status === "failed"
                ? "작업 상태를 확인해 주세요"
                : "완성된 영상을 확인하세요"}
          </p>
        </div>
      )}
      <div
        className={
          compact
            ? `absolute inset-0 flex items-center justify-center ${src && !failed ? "bg-black/10 text-white" : "text-primary"}`
            : "absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent px-3 pb-3 pt-10 text-white"
        }
      >
        <span className={compact ? "sr-only" : "text-xs"}>
          {working
            ? "생성 중"
            : status === "failed"
              ? "다시 시도할 수 있어요"
              : isFallback || failed || !src
                ? "영상 보기"
                : "완성된 영상"}
          {isFallback && src && !failed && (
            <span className="mt-0.5 block text-[10px] opacity-80">
              캐릭터 미리보기
            </span>
          )}
        </span>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
          <Icon
            className={`size-4 ${working ? "motion-safe:animate-spin" : ""}`}
            aria-hidden
          />
        </span>
      </div>
    </>
  );
}
