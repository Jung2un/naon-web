"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/**
 * 모바일 상단 앱바가 쓰는 화면 정보. 1024px 이상에서는 앱바가 없으므로 아무 일도 안 한다.
 *
 * 화면 이름을 앱바가 직접 알 방법이 없다 — 경로로 추측하면 캐릭터 이름 같은
 * 동적 제목을 못 맞춘다. 그래서 `PageHeader`가 자기 제목을 여기 올리고
 * 앱바는 받아 쓴다. 데이터는 여전히 서버에서 내려온 props다 — CLAUDE.md 아키텍처 규칙 1.
 */
type Page = { title: string; back: string | null };

type AppBarStore = {
  /** 지금 화면 이름. `PageHeader`가 없는 화면에서는 null이라 앱바가 로고만 둔다 */
  title: string | null;
  /** 뒤로가기가 필요한 화면이면 돌아갈 기본 경로 */
  back: string | null;
  /** 큰 제목이 앱바 아래로 지나갔는가 — 그때만 앱바에 이름이 뜬다 */
  collapsed: boolean;
  setPage: (page: Page) => void;
  /** 올릴 때 쓴 제목을 그대로 넘긴다. 다음 화면이 이미 올렸으면 지우지 않는다 */
  clearPage: (title: string) => void;
  setCollapsed: (collapsed: boolean) => void;
};

/**
 * Provider가 없어도 터지지 않게 기본값을 no-op으로 둔다.
 * 앱 셸 바깥(로그인 등)에서 `PageHeader`를 쓰더라도 제목만 안 뜨고 화면은 멀쩡하다.
 */
const NOOP: AppBarStore = {
  title: null,
  back: null,
  collapsed: false,
  setPage: () => {},
  clearPage: () => {},
  setCollapsed: () => {},
};

const AppBarContext = createContext<AppBarStore>(NOOP);

export function AppBarProvider({ children }: { children: React.ReactNode }) {
  const [page, setPageState] = useState<Page | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  // 화면 전환 순서(새 화면 mount → 옛 화면 unmount)가 뒤집혀도 이름이 지워지지 않게 한다
  const pageRef = useRef<Page | null>(null);

  const setPage = useCallback((next: Page) => {
    pageRef.current = next;
    setPageState(next);
    setCollapsed(false);
  }, []);

  const clearPage = useCallback((title: string) => {
    if (pageRef.current?.title !== title) return;
    pageRef.current = null;
    setPageState(null);
    setCollapsed(false);
  }, []);

  const value = useMemo<AppBarStore>(
    () => ({
      title: page?.title ?? null,
      back: page?.back ?? null,
      collapsed,
      setPage,
      clearPage,
      setCollapsed,
    }),
    [page, collapsed, setPage, clearPage],
  );

  return <AppBarContext.Provider value={value}>{children}</AppBarContext.Provider>;
}

export function useAppBar() {
  return useContext(AppBarContext);
}

/** 앱바(56px)에 제목이 닿는 순간을 접힘 경계로 삼는다. 앱바 높이와 같이 움직인다 */
const APP_BAR_H = 56;

/**
 * `PageHeader` 안에 심는 자리표시. 큰 제목 바로 아래 1px 줄을 두고,
 * 그 줄이 앱바 밑으로 사라지면 앱바에 화면 이름이 뜬다 (iOS 큰 제목과 같은 방식).
 *
 * 스크롤 이벤트 대신 IntersectionObserver를 쓴다 — 스크롤마다 리렌더하지 않는다.
 */
export function PageTitleSync({
  title,
  back,
}: {
  title: string;
  back: string | null;
}) {
  const { setPage, clearPage, setCollapsed } = useAppBar();
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPage({ title, back });
    return () => clearPage(title);
  }, [title, back, setPage, clearPage]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => setCollapsed(!entry.isIntersecting),
      { rootMargin: `-${APP_BAR_H}px 0px 0px 0px`, threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [setCollapsed]);

  return <div ref={sentinel} aria-hidden className="h-px w-full" />;
}
