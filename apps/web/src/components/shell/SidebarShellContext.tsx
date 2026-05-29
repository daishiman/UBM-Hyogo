"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { useSidebarState, type SidebarState } from "./useSidebarState";

// drawer / collapse 操作を子孫（SidebarMobileTrigger / SidebarDrawer / CollapseToggle）へ配る
// Client context。state owner は useSidebarState 1 系のみ（I-E2）。
const SidebarShellContext = createContext<SidebarState | null>(null);

export function SidebarShellProvider({ children }: { children: ReactNode }) {
  const state = useSidebarState();
  return (
    <SidebarShellContext.Provider value={state}>{children}</SidebarShellContext.Provider>
  );
}

export function useSidebarShellContext(): SidebarState {
  const ctx = useContext(SidebarShellContext);
  if (!ctx) {
    throw new Error(
      "useSidebarShellContext must be used within <SidebarShellProvider> (SidebarShell)",
    );
  }
  return ctx;
}
