"use client";

// unified-sidebar-shell-public-and-admin Task A: drawer / collapse 操作を子孫へ配る context。
// mobileTriggerSlot（Task E）/ collapse toggle / nav item の close 操作がこの context を参照する。
import { createContext, useContext } from "react";
import type { SidebarState } from "./useSidebarState";

const SidebarShellContext = createContext<SidebarState | null>(null);

export const SidebarShellProvider = SidebarShellContext.Provider;

export function useSidebarShell(): SidebarState {
  const ctx = useContext(SidebarShellContext);
  if (ctx === null) {
    throw new Error("useSidebarShell must be used within <SidebarShell>");
  }
  return ctx;
}
