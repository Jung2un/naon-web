import type { Metadata } from "next";
import { PageHeader } from "@/components/app/PageHeader";
import { CharacterForm } from "@/components/app/CharacterForm";

export const metadata: Metadata = { title: "캐릭터 만들기" };

export default function NewCharacterPage() {
  return (
    <>
      <PageHeader
        title="캐릭터 만들기"
        back={{ href: "/characters", label: "캐릭터" }}
      />
      <CharacterForm />
    </>
  );
}
