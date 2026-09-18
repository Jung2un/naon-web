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

/**
 * 데스크톱 사이드바는 여섯 개를 전부 세로로 펼친다.
 *
 * 모바일 하단 탭은 그럴 수 없다 — 엄지가 닿는 줄에 여섯 칸을 넣으면
 * 칸마다 44px을 못 채운다. 그래서 "얼마나 자주 누르는가"로 갈랐다.
 * 대시보드·캐릭터·룩·작업물은 이 서비스에서 실제로 하는 일이라 탭으로 두고,
 * 크레딧·설정은 필요할 때만 찾는 곳이라 더보기 시트로 내렸다.
 * 크레딧 잔량 자체는 상단 바에 늘 떠 있으니 탭까지 내줄 이유가 없다.
 */
export const PRIMARY_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "홈", icon: LayoutDashboard },
  { href: "/characters", label: "캐릭터", icon: Users },
  { href: "/looks", label: "룩", icon: Shirt },
  { href: "/jobs", label: "작업물", icon: Film },
];

export const SECONDARY_NAV_ITEMS: NavItem[] = [
  { href: "/credits", label: "크레딧", icon: Coins },
  { href: "/settings", label: "설정", icon: Settings },
];

/** 데스크톱 사이드바용 — 순서는 기존 그대로다. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "홈", icon: LayoutDashboard },
  ...PRIMARY_NAV_ITEMS.slice(1),
  ...SECONDARY_NAV_ITEMS,
];
