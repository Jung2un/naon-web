import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/app/PageHeader";
import { CharacterStudio } from "@/components/app/CharacterStudio";
import { CharacterRealtime } from "@/components/app/CharacterRealtime";
import { getCharacterBuild } from "@/lib/data/queries";

export async function generateMetadata({
  params,
}: PageProps<"/characters/[id]/build">): Promise<Metadata> {
  const { id } = await params;
  const character = await getCharacterBuild(id);
  return { title: character ? `${character.name} 만들기` : "캐릭터 만들기" };
}

export default async function CharacterBuildPage({
  params,
}: PageProps<"/characters/[id]/build">) {
  const { id } = await params;
  const character = await getCharacterBuild(id);
  if (!character) notFound();

  // 다 만들어진 캐릭터는 여기 머물 이유가 없다.
  if (character.stage === "ready") redirect(`/characters/${id}`);

  return (
    <>
      <PageHeader
        title={character.name}
        description="만드는 중이에요. 이 화면을 닫아도 계속 만들어지고, 캐릭터 목록에서 다시 들어올 수 있어요."
        back={{ href: "/characters", label: "캐릭터" }}
      />
      <CharacterRealtime characterId={id} />
      <CharacterStudio character={character} />
    </>
  );
}
