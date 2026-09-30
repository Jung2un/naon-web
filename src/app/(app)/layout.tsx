import { hasAdminAccess } from "@/lib/admin/data";
import { Sidebar } from "@/components/app/Sidebar";
import { MobileNav } from "@/components/app/MobileNav";
import { BottomNav } from "@/components/app/BottomNav";
import { AccountMenu } from "@/components/app/AccountMenu";
import { AppBarProvider } from "@/components/app/app-bar";
import { JobsRealtime } from "@/components/app/JobsRealtime";
import { getActiveJobCount, getProfile } from "@/lib/data/queries";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const [profile, activeJobs, isAdmin] = await Promise.all([
    getProfile(),
    getActiveJobCount(),
    hasAdminAccess(),
  ]);

  const footer = <AccountMenu isAdmin={isAdmin} />;

  return (
    /*
      모바일 상단 앱바가 화면 이름과 뒤로가기를 띄우려면 본문의 `PageHeader`와
      같은 테두리 안에 있어야 한다. 서버 컴포넌트인 children은 그대로 통과한다.
    */
    <AppBarProvider>
      {/*
        앱바의 "변환 N"이 화면을 옮겨도 맞으려면 구독이 앱 셸에 있어야 한다.
        여기 하나만 둔다 — 작업물 목록에도 같이 두면 같은 이름의 채널이 둘이 된다.
      */}
      <JobsRealtime />

      <div className="min-h-dvh">
        <Sidebar footer={footer} />
        <MobileNav credits={profile?.credits ?? 0} activeJobs={activeJobs} />
        <BottomNav footer={footer} />

        <div className="lg:pl-60">
          {/*
            페이지 좌우 여백 24px (모바일 16px), 컨텐츠 최대 폭 1200px.
            모바일 아래 여백은 하단 탭(--bottom-nav-h) + 홈 인디케이터를 비켜간다.
          */}
          <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-surface focus:p-4">본문으로 건너뛰기</a>
          <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-[1200px] px-4 pb-[calc(var(--bottom-nav-h)+1.5rem)] pt-6 sm:px-8 sm:pt-10 lg:px-10 lg:pb-12">
            {children}
          </main>
        </div>
      </div>
    </AppBarProvider>
  );
}
