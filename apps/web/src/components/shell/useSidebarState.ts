"use client";

// Task A / E — sidebar の collapse / drawer state を管理する client hook。
// 副作用は sidebar collapse cookie の書き込みのみ。API call なし。
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { browserWindow } from "@/lib/is-browser";

import { writeShellCollapsedCookie } from "./shell-collapse-cookie";

export type SidebarStateMode = "expanded" | "collapsed";

export interface SidebarState {
  readonly mode: SidebarStateMode;
  readonly drawerOpen: boolean;
  readonly toggleCollapsed: () => void;
  readonly setDrawerOpen: (open: boolean) => void;
}

/**
 * SSR から渡された cookie seed を初期値に使う。
 * cookie がない場合だけ mount 後に viewport を 1 回だけ参照して確定する:
 * - 値がなく viewport が md(768〜1023px) のときのみ初期 collapsed（Task E responsive 仕様）
 */
export function useSidebarState(initialCollapsed: boolean | null = null): SidebarState {
  const pathname = usePathname();
  const [mode, setMode] = useState<SidebarStateMode>(initialCollapsed ? "collapsed" : "expanded");
  const [drawerOpen, setDrawerOpenState] = useState(false);

  useEffect(() => {
    if (initialCollapsed !== null) return;
    // 永続値がない初回のみ viewport で初期 collapsed を判定（md のみ collapsed）。
    const win = browserWindow();
    if (typeof win?.matchMedia === "function") {
      const isLgUp = win.matchMedia("(min-width: 1024px)").matches;
      const isMdUp = win.matchMedia("(min-width: 768px)").matches;
      if (isMdUp && !isLgUp) setMode("collapsed");
    }
  }, [initialCollapsed]);

  // route 変化で drawer を自動 close（遷移後に overlay が残らないように）。
  useEffect(() => {
    setDrawerOpenState(false);
  }, [pathname]);

  const toggleCollapsed = useCallback(() => {
    setMode((prev) => {
      const next: SidebarStateMode = prev === "collapsed" ? "expanded" : "collapsed";
      writeShellCollapsedCookie(next === "collapsed");
      return next;
    });
  }, []);

  const setDrawerOpen = useCallback((open: boolean) => {
    setDrawerOpenState(open);
  }, []);

  return { mode, drawerOpen, toggleCollapsed, setDrawerOpen };
}
