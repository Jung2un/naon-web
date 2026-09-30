import type { Metadata } from "next";
import { StudioHome } from "@/components/dashboard/StudioHome";
import { HomeViewSwitch } from "@/components/dashboard/HomeViewSwitch";
import { hasAdminAccess } from "@/lib/admin/data";
import {
  getActiveJobCount,
  getCharacters,
  getJobs,
  getProfile,
} from "@/lib/data/queries";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "홈" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [profile, characters, jobs, activeJobs, isAdmin, params] =
    await Promise.all([
      getProfile(),
      getCharacters(),
      getJobs({ limit: 8 }),
      getActiveJobCount(),
      hasAdminAccess(),
      searchParams,
    ]);
  // 운영에서는 서버에서 확인한 관리자만 전환한다. 일반 사용자의 URL 파라미터는 무시한다.
  const canPreview =
    isAdmin ||
    (process.env.NODE_ENV === "development" && !isSupabaseConfigured);
  const previewNew = canPreview && params.homeView === "new";
  // 빈 목록일 때 첫 생성 안내가 자연스럽게 표시된다. 테스트는 DB나 크레딧을 변경하지 않는다.
  return (
    <>
      {canPreview && <HomeViewSwitch previewNew={previewNew} />}
      <StudioHome
        key={previewNew ? "first-visit" : "actual"}
        name={profile?.display_name ?? ""}
        balance={profile?.credits ?? 0}
        characters={previewNew ? [] : characters}
        jobs={previewNew ? [] : jobs}
        activeJobs={previewNew ? 0 : activeJobs}
      />
    </>
  );
}
