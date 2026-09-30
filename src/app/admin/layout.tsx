import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { adminRead } from "@/lib/admin/data";
import { AdminNav } from "@/components/admin/AdminNav";
export const metadata = {
  title: "운영 관리",
  robots: { index: false, follow: false },
};
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await adminRead("access");
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-b border-line bg-surface px-4 py-4 lg:sticky lg:top-0 lg:h-dvh lg:border-r lg:px-5 lg:py-8">
        <Link
          href="/admin"
          className="flex items-center gap-3 px-3 text-lg font-semibold"
        >
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary-soft">
            <ShieldCheck className="size-5" aria-hidden />
          </span>
          운영 관리
        </Link>
        <p className="mb-3 mt-6 hidden px-4 text-caption text-muted lg:block">
          BACK OFFICE
        </p>
        <AdminNav />
        <Link
          href="/dashboard"
          className="mt-3 flex min-h-11 items-center gap-2 px-4 text-sm text-muted lg:mt-10"
        >
          <ArrowLeft className="size-4" aria-hidden />
          스튜디오로 돌아가기
        </Link>
      </aside>
      <main
        id="main-content"
        className="mx-auto w-full min-w-0 max-w-[1440px] px-4 py-8 sm:px-8 lg:px-10"
      >
        {children}
      </main>
    </div>
  );
}
