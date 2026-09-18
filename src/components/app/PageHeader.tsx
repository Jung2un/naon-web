import { BackButton } from "./BackButton";
import { PageTitleSync } from "./app-bar";

/**
 * 화면 맨 위 제목 덩어리.
 *
 * 모바일에서는 이 덩어리가 화면의 3분의 1을 먹던 자리였다 — 30px 제목이 두 줄로 넘어가고,
 * 그 위에 뒤로가기가 한 줄을 더 쓰고, 설명이 15px로 세 줄 흐르면 정작 목록은 스크롤해야 보였다.
 * 그래서 좁은 화면에서는 이렇게 나눈다.
 *
 * - 뒤로가기는 상단 앱바가 맡는다. 본문에는 1024px 이상에서만 둔다.
 * - 제목은 24px. 스크롤해서 밀려나면 앱바가 그 이름을 대신 띄운다(`PageTitleSync`).
 * - 설명은 14px.
 * - 액션 버튼은 폭을 다 쓰고 아랫줄로 내려간다 — 엄지로 겨냥하는 버튼이다.
 *
 * 1024px 이상은 예전 그대로다. — DESIGN.md §8
 */
export function PageHeader({
  title,
  shortTitle,
  description,
  back,
  action,
}: {
  title: string;
  /** 앱바에 띄울 짧은 이름. 제목이 인사말처럼 긴 화면에서만 쓴다 */
  shortTitle?: string;
  description?: string;
  back?: { href: string; label: string };
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      {/* 글자 없이 뒤로가기 아이콘만. href는 이전 기록이 없을 때 갈 곳이다 */}
      {back && (
        <BackButton fallback={back.href} className="hidden lg:inline-flex" />
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-title-mobile font-semibold text-ink lg:text-title">
            {title}
          </h1>
          {/* 제목 바로 아래 1px 자리표시. 이게 앱바 밑으로 사라지면 앱바에 이름이 뜬다 */}
          <PageTitleSync
            title={shortTitle ?? title}
            back={back?.href ?? null}
          />
          {description && (
            <p className="mt-2 max-w-[65ch] text-sm text-body lg:text-base">
              {description}
            </p>
          )}
        </div>
        {action && (
          <div className="w-full sm:w-auto [&>*]:w-full sm:[&>*]:w-auto">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}

/** 섹션 제목 20px/600/-0.3px */
export function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="font-display text-section font-semibold text-ink">{title}</h2>
      {action}
    </div>
  );
}
