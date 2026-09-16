import { Sidebar } from "@/components/app/Sidebar";
import { MobileNav } from "@/components/app/MobileNav";
import { BottomNav } from "@/components/app/BottomNav";
import { AccountMenu } from "@/components/app/AccountMenu";
import { getProfile } from "@/lib/data/queries";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const profile = await getProfile();

  const footer = (
    <AccountMenu
      name={profile?.display_name ?? "내 계정"}
      credits={profile?.credits ?? 0}
    />
  );

  return (
    <div className="min-h-dvh">
      <Sidebar footer={footer} />
      <MobileNav credits={profile?.credits ?? 0} />
      <BottomNav footer={footer} />

      <div className="lg:pl-60">
        {/*
          페이지 좌우 여백 24px (모바일 16px), 컨텐츠 최대 폭 1200px.
          모바일 아래 여백은 하단 탭(--bottom-nav-h) + 홈 인디케이터를 비켜간다.
        */}
        <main className="mx-auto w-full max-w-[1200px] px-4 pb-[calc(var(--bottom-nav-h)+1.5rem)] pt-6 sm:px-6 sm:pt-8 lg:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
