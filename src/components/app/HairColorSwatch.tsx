"use client";
import type { CSSProperties } from "react";
import { Check } from "lucide-react";
import { HAIR_COLORS } from "@/lib/hair-colors";
import { cn } from "@/lib/utils";
export function HairColorSwatch({label,selected,disabled,onSelect}:{label:string;selected:boolean;disabled?:boolean;onSelect:()=>void}) {
 const color = HAIR_COLORS[label];
 return <button type="button" aria-pressed={selected} disabled={disabled} onClick={onSelect} className="group w-full min-w-0 rounded-[16px] text-left disabled:cursor-not-allowed disabled:opacity-40">
  <span className={cn("relative block aspect-[4/3] overflow-hidden rounded-[16px] border transition-shadow",selected?"border-primary ring-2 ring-primary ring-offset-2":"border-line group-hover:shadow-focus")}>
   {color ? <span aria-hidden className="hair-swatch absolute inset-0" style={{"--hair-color":color} as CSSProperties}/> : <span aria-hidden className="absolute inset-0 flex items-center justify-center bg-sunken text-caption text-muted">견본 준비 중</span>}
   {selected && <span className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-primary text-white"><Check className="size-4" aria-hidden/></span>}
  </span><span className={cn("mt-2 block min-h-10 break-keep text-center text-caption",selected?"font-semibold text-primary":"text-body")}>{label}</span>
 </button>;
}
