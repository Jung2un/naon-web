import { LOOKS_ENABLED } from "@/features/looks/config";
import type { Metadata } from "next";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { EmptyState } from "@/components/app/EmptyState";
import { VideoConverter } from "@/components/app/VideoConverter";
import { getCharacters, getLooks, getProfile } from "@/lib/data/queries";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "영상 변환" };
export default async function NewVideoPage() {
  const [allCharacters, looks, profile] = await Promise.all([
    getCharacters(),
    LOOKS_ENABLED ? getLooks() : Promise.resolve([]),
    getProfile(),
  ]);
  const characters = allCharacters.filter((c) =>
    c.stage === "ready" && c.status === "done"
  );
  let available = false;
  if (isSupabaseConfigured) {
    const client = await createClient();
    const { data, error } = await client.functions.invoke("ai-status");
    available = !error && data?.video === true;
  }
  return (
    <>
      <PageHeader
        title="영상 변환"
        description="내 영상 속 모습을 캐릭터로 바꿔 보세요."
        back={{ href: "/jobs", label: "작업물" }}
      />
      {characters.length
        ? (
          <VideoConverter
            characters={characters}
            looks={looks}
            balance={profile?.credits ?? 0}
            available={available}
          />
        )
        : (
          <EmptyState
            icon={Users}
            title="먼저 캐릭터를 완성해 주세요"
            description="완성한 캐릭터가 있어야 영상 속 모습을 바꿀 수 있어요."
            action={{ label: "캐릭터 만들기", href: "/characters/new" }}
          />
        )}
    </>
  );
}
