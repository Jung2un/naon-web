import type { Metadata } from "next";
import Link from "next/link";
import { Shirt } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { LookCard } from "@/components/app/LookCard";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/button";
import { getCharacters, getLooks } from "@/lib/data/queries";

export const metadata: Metadata = { title: "룩" };

export default async function LooksPage() {
  const [looks, characters] = await Promise.all([getLooks(), getCharacters()]);
  const hasCharacter = characters.some((c) => c.status === "done");

  if (looks.length === 0) {
    return (
      <>
        <PageHeader title="룩" />
        {hasCharacter ? (
          <EmptyState
            icon={Shirt}
            title="아직 룩이 없어요"
            description="코디 한 벌을 고르면 룩 하나가 만들어져요. 배경은 찍은 장소 그대로예요."
            action={{ label: "룩 만들기", href: "/looks/new" }}
          />
        ) : (
          <EmptyState
            icon={Shirt}
            title="캐릭터부터 만들어 주세요"
            description="룩은 캐릭터 위에 입히는 거라서, 캐릭터가 하나는 있어야 해요."
            action={{ label: "캐릭터 만들기", href: "/characters/new" }}
          />
        )}
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="룩"
        description="캐릭터에 입히는 머리·옷·장소 조합이에요. 채택한 룩이 앱의 기본값이 돼요."
        action={
          <Button variant="primary" asChild>
            <Link href="/looks/new">룩 만들기</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {looks.map((look) => (
          <LookCard key={look.id} look={look} />
        ))}
      </div>
    </>
  );
}
