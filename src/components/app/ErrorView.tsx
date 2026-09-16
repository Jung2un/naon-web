"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { humanError } from "@/lib/errors";

/**
 * 새 화면을 만들면 로딩과 에러도 같이 만든다. — CLAUDE.md 작업 방식
 * 에러는 사람 말로. 코드는 화면에 그대로 내보내지 않는다.
 */
export function ErrorView({
  error,
  reset,
  message,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  message?: string;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-[420px] flex-col items-center py-14 text-center">
      <div className="flex size-[72px] items-center justify-center rounded-full border border-danger-line bg-danger-bg">
        <AlertCircle className="size-10 text-danger" strokeWidth={1.25} aria-hidden />
      </div>
      <h2 className="mt-5 font-display text-section font-semibold text-ink">
        불러오지 못했어요
      </h2>
      <p className="mt-2 text-base text-muted">{message ?? humanError(null)}</p>
      <Button variant="primary" onClick={reset} className="mt-6">
        다시 시도
      </Button>
      {error.digest && (
        <p className="mt-4 text-caption tabular text-muted">{error.digest}</p>
      )}
    </div>
  );
}
