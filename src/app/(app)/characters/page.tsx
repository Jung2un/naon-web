import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { CharacterCard } from "@/components/app/CharacterCard";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/button";
import { getCharacters } from "@/lib/data/queries";

export const metadata: Metadata = { title: "캐릭터" };

export default async function CharactersPage() {
  const characters = await getCharacters();

  if (characters.length === 0) {
    return (
      <>
        <PageHeader title="캐릭터" />
        <EmptyState
          icon={Users}
          title="아직 캐릭터가 없어요"
          description="톤을 고르면 후보 4장을 뽑아 드려요. 마음에 드는 얼굴을 골라 다듬으면 돼요."
          action={{ label: "캐릭터 만들기", href: "/characters/new" }}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="캐릭터"
        description="톤을 골라 뽑고 다듬은 내 캐릭터예요. 룩과 작업물이 캐릭터에 붙어요."
        action={
          <Button variant="primary" asChild>
            <Link href="/characters/new">캐릭터 만들기</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {characters.map((character) => (
          <CharacterCard key={character.id} character={character} />
        ))}
      </div>
    </>
  );
}
