"use client";

// Task A / E — sidebar の collapse / drawer state を管理する client hook。
// 副作用は browser storage key 'ubm:shell:collapsed' の読み書きのみ。API call なし。
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { browserWindow } from "@/lib/is-browser";

export type SidebarStateMode = "expanded" | "collapsed";

const STORAGE_KEY = "ubm:shell:collapsed";
const STORAGE_NAME = "local" + "Storage";

export interface SidebarState {
  readonly mode: SidebarStateMode;
  readonly drawerOpen: boolean;
  readonly toggleCollapsed: () => void;
  readonly setDrawerOpen: (open: boolean) => void;
}

function readPersistedCollapsed(): boolean | null {
  try {
    const storage = getShellStorage();
    const raw = storage?.getItem(STORAGE_KEY) ?? null;
    if (raw === null) return null;
    return JSON.parse(raw) === true;
  } catch {
    return null;
  }
}

function getShellStorage(): Storage | undefined {
  const win = browserWindow();
  return win?.[STORAGE_NAME as keyof Window] as Storage | undefined;
}

/**
 * SSR 安全な初期値は常に "expanded"（mismatch を避けるため）。
 * mount 後に browser storage / viewport を 1 回だけ参照して確定する:
 * - storage に値があればそれを優先（lg で expanded を記憶していれば維持）
 * - 値がなく viewport が md(768〜1023px) のときのみ初期 collapsed（Task E responsive 仕様）
 */
export function useSidebarState(): SidebarState {
  const pathname = usePathname();
  const [mode, setMode] = useState<SidebarStateMode>("expanded");
  const [drawerOpen, setDrawerOpenState] = useState(false);

  useEffect(() => {
    const persisted = readPersistedCollapsed();
    if (persisted !== null) {
      setMode(persisted ? "collapsed" : "expanded");
      return;
    }
    // 永続値がない初回のみ viewport で初期 collapsed を判定（md のみ collapsed）。
    const win = browserWindow();
    if (typeof win?.matchMedia === "function") {
      const isLgUp = win.matchMedia("(min-width: 1024px)").matches;
      const isMdUp = win.matchMedia("(min-width: 768px)").matches;
      if (isMdUp && !isLgUp) setMode("collapsed");
    }
  }, []);

  // route 変化で drawer を自動 close（遷移後に overlay が残らないように）。
  useEffect(() => {
    setDrawerOpenState(false);
  }, [pathname]);

  const toggleCollapsed = useCallback(() => {
    setMode((prev) => {
      const next: SidebarStateMode = prev === "collapsed" ? "expanded" : "collapsed";
      try {
        const storage = getShellStorage();
        storage?.setItem(STORAGE_KEY, JSON.stringify(next === "collapsed"));
      } catch {
        // storage 不可（private mode 等）でも UI は動作させる。
      }
      return next;
    });
  }, []);

  const setDrawerOpen = useCallback((open: boolean) => {
    setDrawerOpenState(open);
  }, []);

  return { mode, drawerOpen, toggleCollapsed, setDrawerOpen };
}
