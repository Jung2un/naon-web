"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

/**
 * 뒤로가기 아이콘 버튼. 글자 없이 화살표만 둔다.
 *
 * 누르면 브라우저 뒤로가기다. 주소를 바로 치고 들어와 이 앱 안의 이전 기록이 없으면
 * fallback(원래 목록)으로 보낸다 — 뒤로가 앱 밖으로 나가 버리지 않게.
 * 시각 크기는 작아도 터치 대상은 44px다.
 */
export function BackButton({ fallback }: { fallback: string }) {
  const router = useRouter();

  function goBack() {
    const cameFromApp =
      typeof document !== "undefined" &&
      document.referrer.startsWith(window.location.origin) &&
      window.history.length > 1;
    if (cameFromApp) router.back();
    else router.push(fallback);
  }

  return (
    <button
      type="button"
      onClick={goBack}
      aria-label="뒤로 가기"
      className="-ml-2.5 mb-2 inline-flex size-11 cursor-pointer items-center justify-center rounded-[6px] text-muted transition-colors duration-150 ease-out hover:bg-hover hover:text-ink"
    >
      <ChevronLeft className="size-5" aria-hidden />
    </button>
  );
}
