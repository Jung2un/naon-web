"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { OAuthProvider } from "@/lib/auth-providers";
import { GoogleMark, KakaoMark } from "./brand-marks";

/**
 * OAuth 브랜드 버튼 — DESIGN.md §6, 색 규칙이 면제되는 유일한 자리.
 * 라운드 6px, 높이 48px, 폭 100%, 글자 15px. 로고 왼쪽 정렬, 텍스트 가운데.
 *
 * 공급자가 늘어나면 여기가 아니라 `src/lib/auth-providers.ts` 배열이 늘어난다.
 */
const MARKS: Record<string, React.ReactNode> = {
  google: <GoogleMark />,
  kakao: <KakaoMark />,
};

export function OAuthButton({
  provider,
  pending = false,
  disabled = false,
  onClick,
}: {
  provider: OAuthProvider;
  pending?: boolean;
  disabled?: boolean;
  onClick?: (provider: OAuthProvider) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const preparing = provider.status === "preparing";
  const inactive = preparing || disabled || pending;

  return (
    <div>
      <button
        type="button"
        onClick={() => !inactive && onClick?.(provider)}
        disabled={inactive}
        aria-disabled={inactive}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background:
            hovered && !inactive ? provider.brand.hover : provider.brand.background,
          color: provider.brand.color,
          border: provider.brand.border,
        }}
        className={cn(
          "relative flex h-12 w-full items-center rounded-[6px] px-4 text-base",
          "transition-[background-color,opacity] duration-150 ease-out",
          "active:opacity-80",
          preparing && "cursor-not-allowed opacity-45",
          !preparing && disabled && "cursor-not-allowed opacity-60",
          pending && "opacity-70",
        )}
      >
        <span className="absolute left-4 flex size-5 items-center justify-center">
          {MARKS[provider.id] ?? null}
        </span>
        <span className="w-full text-center">
          {pending ? "이동 중…" : provider.label}
        </span>
      </button>

      {preparing && provider.note && (
        <p className="mt-1.5 text-caption text-muted">{provider.note}</p>
      )}
    </div>
  );
}
