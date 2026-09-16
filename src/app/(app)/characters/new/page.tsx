import type { Metadata } from "next";
import { PageHeader } from "@/components/app/PageHeader";
import { CharacterDraftForm } from "@/components/app/CharacterDraftForm";
import { getCharacterOptions } from "@/lib/data/queries";

export const metadata: Metadata = { title: "캐릭터 만들기" };

export default async function NewCharacterPage() {
  const options = await getCharacterOptions();

  return (
    <>
      <PageHeader
        title="캐릭터 만들기"
        description="톤과 분위기를 고르면 후보 4장을 뽑아 드려요. 사진은 필요 없어요."
        back={{ href: "/characters", label: "캐릭터" }}
      />
      <CharacterDraftForm options={options} />
    </>
  );
}
