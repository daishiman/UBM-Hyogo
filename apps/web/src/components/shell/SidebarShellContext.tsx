"use client";

// unified-sidebar-shell / Task A: drawer / collapse 操作を子（MobileTrigger 等）へ配るための context。
import { createContext, useContext } from "react";

export type SidebarShellContextValue = {
  collapsed: boolean;
  drawerOpen: boolean;
  toggleCollapsed: () => void;
  setDrawerOpen: (open: boolean) => void;
};

const SidebarShellContext = createContext<SidebarShellContextValue | null>(null);

export const SidebarShellProvider = SidebarShellContext.Provider;

export function useSidebarShellContext(): SidebarShellContextValue {
  const ctx = useContext(SidebarShellContext);
  if (!ctx) {
    throw new Error("useSidebarShellContext must be used within <SidebarShell>");
  }
  return ctx;
}
