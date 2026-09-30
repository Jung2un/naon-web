import Link from "next/link";

export function HomeViewSwitch({ previewNew }: { previewNew: boolean }) {
  return (
    <div className="mb-5 h-16 lg:h-12">
      <aside
        aria-label="관리자 홈 화면 테스트"
        className="fixed right-4 top-[calc(env(safe-area-inset-top)+4rem)] z-30 max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-surface/95 p-1.5 shadow-sm backdrop-blur-md lg:right-6 lg:top-4"
      >
        <div className="flex items-center gap-1">
          <span className="px-2 text-[11px] font-semibold text-muted">
            관리자 테스트
          </span>
          <Link
            href="/dashboard"
            replace
            scroll={false}
            aria-current={!previewNew ? "page" : undefined}
            className={`inline-flex min-h-11 items-center rounded-xl px-3 text-xs ${!previewNew ? "bg-primary font-semibold text-on-dark" : "text-muted hover:bg-primary-soft"}`}
          >
            기존 사용자
          </Link>
          <Link
            href="/dashboard?homeView=new"
            replace
            scroll={false}
            aria-current={previewNew ? "page" : undefined}
            className={`inline-flex min-h-11 items-center rounded-xl px-3 text-xs ${previewNew ? "bg-primary font-semibold text-on-dark" : "text-muted hover:bg-primary-soft"}`}
          >
            처음 방문
          </Link>
        </div>
        {previewNew && (
          <p className="px-2 pb-1 pt-1 text-[11px] text-muted">
            첫 방문 화면 테스트 중 · 실제 잔액은 그대로예요
          </p>
        )}
      </aside>
    </div>
  );
}
