import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Users, Shirt, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
export function StudioGuide({hasCharacter=false}:{hasCharacter?:boolean}) {
  return <section className="overflow-hidden rounded-[24px] border border-line bg-surface">
    <div className="grid items-center gap-6 p-6 sm:p-8 md:grid-cols-[1.2fr_1fr]">
      <div><p className="text-caption font-semibold text-primary">나만의 캐릭터 스튜디오</p><h2 className="mt-3 text-title-mobile leading-snug sm:text-title">상상하던 나를,<br/>캐릭터로 만나 보세요</h2><p className="mt-3 max-w-sm text-body">분위기부터 스타일링까지 내 취향대로.<br/>완성한 캐릭터가 영상 속 나를 대신해요.</p><Button variant="primary" asChild className="mt-6"><Link href="/characters/new">새 캐릭터 만들기 <ArrowRight aria-hidden/></Link></Button></div>
      <div className="grid grid-cols-3 items-center gap-3" aria-label="선택할 수 있는 캐릭터 스타일 예시">{[{id:1,label:"실사"},{id:5,label:"애니"},{id:6,label:"3D 캐릭터"}].map((item,i)=><div key={item.id} className={i===1?"pt-6":"pb-6"}><div className="relative aspect-[3/4] overflow-hidden rounded-[18px] bg-sunken"><Image src={"/catalog/tone/"+item.id+".jpg"} alt={item.label+" 스타일 예시"} fill sizes="(max-width: 768px) 28vw, 170px" className="object-cover"/></div><p className="mt-2 text-center text-caption text-muted">{item.label}</p></div>)}</div>
    </div>
    <ol className="grid border-t border-line bg-cream/50 sm:grid-cols-3">{[{icon:Users,title:"캐릭터 만들기",description:"톤을 고르고 얼굴을 완성해요",href:"/characters/new"},{icon:Shirt,title:"스타일 입히기",description:hasCharacter?"캐릭터에 어울리는 옷을 골라요":"캐릭터를 완성한 뒤 시작해요",href:hasCharacter?"/looks/new":"/characters"},{icon:Film,title:"영상 변환하기",description:"영상을 올리고 새로운 나를 만나요",href:"/jobs/new"}].map(({icon:Icon,...step},i)=><li key={step.href}><Link href={step.href} className="flex min-h-24 items-center gap-3 p-5 transition-colors hover:bg-primary-soft"><span className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-surface text-primary"><Icon className="size-5" aria-hidden/></span><div><p className="text-sm font-semibold">{i+1}. {step.title}</p><p className="mt-1 text-caption text-muted">{step.description}</p></div></Link></li>)}</ol>
  </section>;
}
