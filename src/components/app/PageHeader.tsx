import { BackButton } from "./BackButton";

export function PageHeader({
  title,
  description,
  back,
  action,
}: {
  title: string;
  description?: string;
  back?: { href: string; label: string };
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      {/* 글자 없이 뒤로가기 아이콘만. href는 이전 기록이 없을 때 갈 곳이다 */}
      {back && <BackButton fallback={back.href} />}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-title font-semibold text-ink">{title}</h1>
          {description && (
            <p className="mt-2 max-w-[65ch] text-base text-body">{description}</p>
          )}
        </div>
        {action}
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
