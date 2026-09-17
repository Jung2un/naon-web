import type { Metadata } from "next";
import { Shirt } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { LookBuilder } from "@/components/app/LookBuilder";
import { EmptyState } from "@/components/app/EmptyState";
import { getCharacters, getPresets } from "@/lib/data/queries";

export const metadata: Metadata = { title: "룩 만들기" };

export default async function NewLookPage({
  searchParams,
}: PageProps<"/looks/new">) {
  const [params, characters, presets] = await Promise.all([
    searchParams,
    getCharacters(),
    getPresets(),
  ]);

  // 룩은 끝까지 만들어진 캐릭터 위에만 입힌다. — docs/기획서.md §5
  const usable = characters.filter(
    (c) => c.stage === "ready" && c.status === "done",
  );

  if (usable.length === 0) {
    return (
      <>
        <PageHeader title="룩 만들기" back={{ href: "/looks", label: "룩" }} />
        <EmptyState
          icon={Shirt}
          title="쓸 수 있는 캐릭터가 없어요"
          description="룩은 3방향까지 끝난 캐릭터 위에만 입힐 수 있어요. 캐릭터를 완성하고 돌아와 주세요."
          action={{ label: "캐릭터 만들기", href: "/characters/new" }}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="룩 만들기"
        description="코디 한 벌을 고르면 돼요. 장소는 원할 때만 골라요."
        back={{ href: "/looks", label: "룩" }}
      />
      <LookBuilder
        presets={presets}
        characters={characters}
        defaultCharacterId={
          typeof params.character === "string" ? params.character : undefined
        }
      />
    </>
  );
}
