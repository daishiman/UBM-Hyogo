"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { SidebarStateMode } from "./useSidebarState";

export type SidebarShellContextValue = {
  mode: SidebarStateMode;
  drawerOpen: boolean;
  toggleCollapsed: () => void;
  setDrawerOpen: (open: boolean) => void;
};

const SidebarShellContext = createContext<SidebarShellContextValue | null>(null);

export function SidebarShellProvider({
  value,
  children,
}: {
  readonly value: SidebarShellContextValue;
  readonly children: ReactNode;
}) {
  return (
    <SidebarShellContext.Provider value={value}>{children}</SidebarShellContext.Provider>
  );
}

export function useSidebarShellContext(): SidebarShellContextValue {
  const ctx = useContext(SidebarShellContext);
  if (!ctx) {
    throw new Error("useSidebarShellContext must be used inside <SidebarShellProvider>");
  }
  return ctx;
}
