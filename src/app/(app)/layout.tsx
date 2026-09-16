import { Sidebar } from "@/components/app/Sidebar";
import { MobileNav } from "@/components/app/MobileNav";
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
      <MobileNav footer={footer} />

      <div className="lg:pl-60">
        {/* 페이지 좌우 여백 24px (모바일 16px), 컨텐츠 최대 폭 1200px */}
        <main className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
