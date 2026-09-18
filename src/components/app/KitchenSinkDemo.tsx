"use client";
import { useState } from "react";
import { HairColorSwatch } from "./HairColorSwatch";
import { HAIR_COLORS } from "@/lib/hair-colors";
export function KitchenSinkDemo(){const [selected,setSelected]=useState<string|undefined>("코토리 베이지");return <div><div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-7">{Object.keys(HAIR_COLORS).map(label=><HairColorSwatch key={label} label={label} selected={selected===label} onSelect={()=>setSelected(selected===label?undefined:label)}/>)}</div><p role="status" className="mt-3 text-sm text-muted">{selected ? "선택한 머리색: "+selected : "머리색을 선택해 주세요"}</p><div className="mt-4 max-w-28"><HairColorSwatch label="검정" selected={false} disabled onSelect={()=>{}}/></div></div>}
