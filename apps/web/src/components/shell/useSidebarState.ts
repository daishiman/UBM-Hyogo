"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { browserDocument, browserLocalStorage } from "../../lib/is-browser";

export type SidebarStateMode = "expanded" | "collapsed";

export interface SidebarState {
  mode: SidebarStateMode;
  drawerOpen: boolean;
  toggleCollapsed: () => void;
  setDrawerOpen: (open: boolean) => void;
}

// 永続化キー（Task A 正本）。JSON boolean: true = collapsed。
const STORAGE_KEY = "ubm:shell:collapsed";

function getView(): (Window & typeof globalThis) | undefined {
  return browserDocument()?.defaultView ?? undefined;
}

/** 永続ストレージに collapsed 値が明示されているか（viewport 既定より優先される判定）。 */
function hasPersistedMode(): boolean {
  const storage = browserLocalStorage();
  if (!storage) return false;
  try {
    return storage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

/** SSR 安全な初期 mode 読み取り。未設定 / 非ブラウザは expanded。 */
function readPersistedMode(): SidebarStateMode {
  const storage = browserLocalStorage();
  if (!storage) return "expanded";
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw === null) return "expanded";
    return JSON.parse(raw) === true ? "collapsed" : "expanded";
  } catch {
    return "expanded";
  }
}

function persistMode(mode: SidebarStateMode): void {
  const storage = browserLocalStorage();
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(mode === "collapsed"));
  } catch {
    /* Web Storage 不可（private mode 等）は no-op */
  }
}

/**
 * collapsible sidebar + mobile drawer の単一 state owner（I-E2）。
 *
 * - `mode`: expanded / collapsed（Web Storage `ubm:shell:collapsed` で永続）
 * - `drawerOpen`: mobile overlay drawer の開閉
 * - 初回マウント時に viewport 既定 collapsed を 1 回だけ適用（Task E / AC-E9・AC-E10）
 * - route 変化で drawer を自動 close（Task E / AC-E7・AC-E8）
 *
 * breakpoint 追従の resize listener は設けない。`matchMedia` 参照は初回 effect の 1 回限り（I-E5）。
 */
export function useSidebarState(): SidebarState {
  const [mode, setMode] = useState<SidebarStateMode>(() => readPersistedMode());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  // (a) route 変化で drawer を自動 close（AC-E7 / AC-E8）。
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // (b) 初回マウントで viewport 既定 collapsed を適用（AC-E9 / AC-E10）。
  //     永続値が明示されている場合はそちらを優先。1 回限り・resize 非追従。
  useEffect(() => {
    if (hasPersistedMode()) return;
    const view = getView();
    if (!view?.matchMedia) return; // SSR / 非対応は no-op（expanded fallback）
    const isLg = view.matchMedia("(min-width: 1024px)").matches;
    setMode(isLg ? "expanded" : "collapsed");
  }, []);

  const toggleCollapsed = useCallback(() => {
    setMode((prev) => {
      const next: SidebarStateMode = prev === "expanded" ? "collapsed" : "expanded";
      persistMode(next);
      return next;
    });
  }, []);

  return { mode, drawerOpen, toggleCollapsed, setDrawerOpen };
}
