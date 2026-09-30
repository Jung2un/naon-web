"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function NotFoundBackButton() {
  const router = useRouter();
  function back() {
    let sameOrigin = false;
    try {
      sameOrigin = new URL(document.referrer).origin === window.location.origin;
    } catch {
      /* 직접 방문하면 홈으로 이동한다. */
    }
    if (sameOrigin && window.history.length > 1) router.back();
    else router.replace("/dashboard");
  }
  return (
    <button
      type="button"
      onClick={back}
      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-line bg-surface px-6 text-sm font-semibold text-ink transition-colors hover:bg-primary-soft"
    >
      <ArrowLeft className="size-4" aria-hidden />
      이전 화면으로
    </button>
  );
}
