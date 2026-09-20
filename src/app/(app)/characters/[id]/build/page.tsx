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
        description={character.status === "processing" ? "이미지를 생성하고 있어요. 아래에서 진행 상태를 확인할 수 있어요." : character.status === "failed" ? "생성을 완료하지 못했어요. 원인을 확인하고 다시 시도해 주세요." : "마음에 드는 얼굴을 고르고 캐릭터를 완성해 주세요."}
        back={{ href: "/characters", label: "캐릭터" }}
      />
      <CharacterRealtime characterId={id} />
      <CharacterStudio character={character} />
    </>
  );
}
