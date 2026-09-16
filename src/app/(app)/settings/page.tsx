import type { Metadata } from "next";
import { PageHeader, SectionHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { getProfile } from "@/lib/data/queries";
import { fullTime } from "@/lib/format";

export const metadata: Metadata = { title: "설정" };

export default async function SettingsPage() {
  const profile = await getProfile();

  return (
    <>
      <PageHeader title="설정" />

      <section>
        <SectionHeader title="계정" />
        <dl className="rounded-[12px] border border-line bg-cream p-5">
          <div className="flex items-baseline justify-between gap-4 border-b border-line pb-3">
            <dt className="text-caption text-muted">이름</dt>
            <dd className="text-sm text-ink">{profile?.display_name ?? "—"}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 border-b border-line py-3">
            <dt className="text-caption text-muted">가입</dt>
            <dd className="text-sm text-ink">
              {profile ? fullTime(profile.created_at) : "—"}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 pt-3">
            <dt className="text-caption text-muted">로그인 방식</dt>
            <dd className="text-sm text-ink">Google</dd>
          </div>
        </dl>
      </section>

      <section className="mt-10">
        <SectionHeader title="계정 삭제" />
        <div className="rounded-[12px] border border-line bg-cream p-5">
          <p className="max-w-[65ch] text-base text-body">
            계정을 지우면 캐릭터·룩·작업물과 남은 크레딧이 모두 사라져요. 되돌릴 수
            없어요.
          </p>
          <Button variant="destructive" className="mt-4" disabled>
            계정 삭제
          </Button>
        </div>
      </section>

      <div className="mt-10 lg:hidden">
        <form action="/auth/signout" method="post">
          <Button type="submit" variant="outline">
            로그아웃
          </Button>
        </form>
      </div>
    </>
  );
}
