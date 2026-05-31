"use client";

// Task A — drawer / collapse 操作を子孫（MobileTrigger / CollapseToggle）へ配るための context。
import { createContext, useContext } from "react";

import type { SidebarStateMode } from "./useSidebarState";

export interface SidebarShellContextValue {
  readonly mode: SidebarStateMode;
  readonly drawerOpen: boolean;
  readonly toggleCollapsed: () => void;
  readonly setDrawerOpen: (open: boolean) => void;
}

const SidebarShellContext = createContext<SidebarShellContextValue | null>(null);

export const SidebarShellProvider = SidebarShellContext.Provider;

/**
 * context が無い場所で呼ばれた場合（テスト単体 mount 等）は no-op の安全値を返す。
 * これにより MobileTrigger / CollapseToggle を context 外で render しても throw しない。
 */
export function useSidebarShellContext(): SidebarShellContextValue {
  const ctx = useContext(SidebarShellContext);
  if (ctx) return ctx;
  return {
    mode: "expanded",
    drawerOpen: false,
    toggleCollapsed: () => {},
    setDrawerOpen: () => {},
  };
}
