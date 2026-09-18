"use client";
import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CharacterCard } from "./CharacterCard";
import { cn } from "@/lib/utils";
import type { CharacterListItem } from "@/types/models";
const filters = [{id:"all",label:"전체"},{id:"ready",label:"완성"},{id:"building",label:"만드는 중"},{id:"failed",label:"확인 필요"}] as const;
type Filter = typeof filters[number]["id"];
export function CharacterLibrary({characters}:{characters:CharacterListItem[]}) {
  const [query,setQuery] = useState("");
  const [filter,setFilter] = useState<Filter>("all");
  const matches = (c:CharacterListItem, f:Filter) => f === "all" || (f === "failed" ? c.status === "failed" : f === "ready" ? c.stage === "ready" && c.status === "done" : c.stage !== "ready" && c.status !== "failed");
  const visible = characters.filter(c => matches(c,filter) && c.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  return <section aria-label="내 캐릭터 목록">
    <div className="mb-6 flex flex-col gap-4 rounded-[20px] border border-line bg-surface p-4 sm:p-5">
      <div className="relative max-w-md"><Search aria-hidden className="absolute left-4 top-4 size-4 text-muted"/><Input aria-label="캐릭터 이름 검색" placeholder="캐릭터 이름으로 검색해요" value={query} onChange={e=>setQuery(e.target.value)} className="pl-11"/></div>
      <div className="flex flex-wrap gap-2" aria-label="캐릭터 상태 필터">{filters.map(f=><button key={f.id} type="button" aria-pressed={filter===f.id} onClick={()=>setFilter(f.id)} className={cn("min-h-11 rounded-full px-4 text-sm transition-colors",filter===f.id?"bg-primary-soft font-semibold text-primary":"bg-cream text-muted hover:bg-sunken")}>{f.label} <span className="ml-1 tabular">{characters.filter(c=>matches(c,f.id)).length}</span></button>)}</div>
    </div>
    <p role="status" className="mb-4 text-caption text-muted">캐릭터 {visible.length}개</p>
    {visible.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 xl:grid-cols-4">{visible.map(c=><CharacterCard key={c.id} character={c}/>)}</div> : <div className="rounded-[20px] bg-surface px-5 py-14 text-center"><SlidersHorizontal aria-hidden className="mx-auto size-8 text-muted"/><h2 className="mt-4 text-section">검색 결과가 없어요</h2><p className="mt-2 text-muted">다른 이름을 검색하거나 필터를 바꿔 보세요.</p><Button className="mt-5" onClick={()=>{setQuery("");setFilter("all");}}>검색·필터 초기화</Button></div>}
  </section>;
}
