"use client";

import Link from "next/link";
import { Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import { credits as fmt } from "@/lib/format";
import { LOW_CREDIT_BALANCE } from "@/types/models";

import { BrandMark } from "./BrandMark";
import { BackButton } from "./BackButton";
import { useAppBar } from "./app-bar";

/**
 * 모바일 상단 앱바 — 1024px 미만. 이동은 하단 탭이 맡는다(BottomNav).
 *
 * 왼쪽은 되돌아갈 곳(없으면 로고), 가운데는 지금 어느 화면인지, 오른쪽은 상황 자리다.
 *
 * 화면 이름은 **큰 제목이 앱바 밑으로 지나간 뒤에** 뜬다. 본문 맨 위에서 같은 이름이
 * 두 번 보이면 좁은 화면에서 한 줄을 그냥 버리는 셈이다. 접힌 뒤에만 아래 구분선도 같이 나타난다.
 *
 * 데스크톱은 이 바가 서지 않는다. 사이드바가 그대로다.
 */
export function MobileNav({
  credits,
  activeJobs,
}: {
  credits: number;
  activeJobs: number;
}) {
  const { title, back, collapsed } = useAppBar();

  return (
    <header
      className={cn(
        // 노치 기기에서 상태바 밑으로 파고들지 않게 안전영역만큼 위를 띄운다
        "sticky top-0 z-40 bg-surface pt-[env(safe-area-inset-top)] lg:hidden",
        "border-b transition-colors duration-150 ease-out",
        collapsed ? "border-line" : "border-transparent",
      )}
    >
      <div className="flex h-14 items-center gap-1 px-2">
        {back ? (
          <BackButton fallback={back} className="mb-0 ml-0" />
        ) : (
          <Link
            href="/dashboard"
            aria-label="대시보드로 가기"
            className="flex size-11 shrink-0 items-center justify-center"
          >
            <BrandMark size="sm" />
          </Link>
        )}

        {/*
          본문 <h1>과 같은 글자라 읽어 주면 두 번 읽힌다. 제목 구실은 <h1>이 하고
          여기는 눈으로 위치를 확인하는 자리라 aria-hidden으로 둔다.
        */}
        <span
          aria-hidden
          className={cn(
            "min-w-0 flex-1 truncate px-1 text-card font-semibold text-ink",
            "transition-opacity duration-150 ease-out",
            collapsed ? "opacity-100" : "opacity-0",
          )}
        >
          {title}
        </span>

        <AppBarStatus credits={credits} activeJobs={activeJobs} />
      </div>
    </header>
  );
}

/**
 * 앱바 오른쪽 상황 자리. **알려줄 게 있을 때만 선다.**
 *
 * 크레딧 잔량을 늘 띄우던 자리였는데, 잔량은 대시보드 카드에도, 더보기 시트에도,
 * 실제로 크레딧을 쓰는 화면의 하단 바에도 이미 있다. 넉넉할 때 네 번째로 한 번 더
 * 보여 봐야 읽히지 않고, 좁은 화면에서 제목이 쓸 폭만 가져간다.
 * 그래서 평소에는 비우고, 사용자가 **모르면 손해 보는 두 가지**일 때만 채운다.
 *
 * 1. 돌고 있는 변환이 있을 때 — 1~3분 걸리고 화면을 옮겨도 계속 도는 일이라,
 *    지금 기다리는 중인 사람에게는 잔량보다 이게 급하다. 누르면 작업물로 간다.
 * 2. 크레딧이 곧 떨어질 때 — 막히기 전에 알려주는 값이라 이때만 자리를 얻는다.
 *
 * 둘 다면 변환이 이긴다. 진행 중인 일이 먼저다.
 */
function AppBarStatus({
  credits,
  activeJobs,
}: {
  credits: number;
  activeJobs: number;
}) {
  if (activeJobs > 0) {
    return (
      <Link
        href="/jobs"
        aria-label={`변환 중인 영상 ${activeJobs}건. 작업물로 가기`}
        className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-line-strong px-3 text-body transition-colors duration-150 ease-out hover:bg-hover"
      >
        {/* StatusBadge의 처리 중 링과 같은 표시 — reduced-motion에서 투명도 펄스로 바뀐다 */}
        <span
          data-motion="keep"
          className="motion-spin size-[9px] shrink-0 rounded-full border border-current border-t-transparent"
          aria-hidden
        />
        <span aria-hidden className="text-sm">
          변환 <span className="tabular text-ink">{activeJobs}</span>
        </span>
      </Link>
    );
  }

  if (credits < LOW_CREDIT_BALANCE) {
    return (
      <Link
        href="/credits"
        aria-label={`크레딧이 ${fmt(credits)}개 남았어요. 충전하러 가기`}
        className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-ink px-3 text-on-dark shadow-inset transition-opacity duration-150 ease-out active:opacity-80"
      >
        <Coins className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
        <span aria-hidden className="text-sm tabular">
          {fmt(credits)}
        </span>
      </Link>
    );
  }

  // 알려줄 게 없으면 자리를 비운다 — 제목이 그만큼 넓게 쓴다
  return null;
}
