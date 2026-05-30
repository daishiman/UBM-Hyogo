"use client";

// unified-sidebar-shell / Task A + E: sidebar collapse / mobile drawer の client state。
// - collapse 状態は @ubm-hyogo/shared/browser-storage 経由で永続化（key: 'ubm:shell:collapsed', JSON boolean）。
//   apps/web は SSR 境界保護のためブラウザ storage へ直接アクセスせず、guard 済み helper に集約する。
// - 初期 collapsed 判定: lg 未満（< 1024px）は collapsed 寄り。SSR では参照しない。
// - route 変化（usePathname）で drawer を自動 close。
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { readPersistedBoolean, writePersistedBoolean } from "@ubm-hyogo/shared/browser-storage";
import { isBrowser } from "../../lib/is-browser";

export type SidebarStateMode = "expanded" | "collapsed";

export const SIDEBAR_COLLAPSED_STORAGE_KEY = "ubm:shell:collapsed";

function detectInitialCollapsed(): boolean {
  const persisted = readPersistedBoolean(SIDEBAR_COLLAPSED_STORAGE_KEY);
  if (persisted !== null) return persisted;
  if (!isBrowser()) return false;
  // 永続値が無い時のみ viewport で初期値を決める（lg 未満は collapsed 寄り）。
  try {
    // eslint-disable-next-line no-restricted-globals -- isBrowser() guard above
    return !window.matchMedia("(min-width: 1024px)").matches;
  } catch {
    return false;
  }
}

export function useSidebarState(): {
  mode: SidebarStateMode;
  collapsed: boolean;
  drawerOpen: boolean;
  toggleCollapsed: () => void;
  setDrawerOpen: (open: boolean) => void;
} {
  const pathname = usePathname();
  // SSR/初回 hydration は expanded で確定させ、mount 後に実値へ補正する（mismatch 回避）。
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setCollapsed(detectInitialCollapsed());
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      writePersistedBoolean(SIDEBAR_COLLAPSED_STORAGE_KEY, next);
      return next;
    });
  }, []);

  // route 変化で drawer を自動 close。
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  return {
    mode: collapsed ? "collapsed" : "expanded",
    collapsed,
    drawerOpen,
    toggleCollapsed,
    setDrawerOpen,
  };
}
