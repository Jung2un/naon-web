import {
  LayoutDashboard,
  Users,
  Shirt,
  Film,
  Coins,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/characters", label: "캐릭터", icon: Users },
  { href: "/looks", label: "룩", icon: Shirt },
  { href: "/jobs", label: "작업물", icon: Film },
  { href: "/credits", label: "크레딧", icon: Coins },
  { href: "/settings", label: "설정", icon: Settings },
];
