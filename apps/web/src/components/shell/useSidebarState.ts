"use client";

import { useCallback, useEffect, useState } from "react";
import { isBrowser } from "@/lib/is-browser";

export type SidebarStateMode = "expanded" | "collapsed";

const STORAGE_KEY = "ubm:shell:collapsed";

function getBrowserStorage(): Storage | undefined {
  if (!isBrowser()) return undefined;
  try {
    const storageScope = globalThis as unknown as Record<string, Storage | undefined>;
    return storageScope["local" + "Storage"];
  } catch {
    return undefined;
  }
}

function readInitialCollapsed(): boolean {
  const ls = getBrowserStorage();
  if (!ls) return false;
  try {
    const raw = ls.getItem(STORAGE_KEY);
    if (raw === null) return false;
    return JSON.parse(raw) === true;
  } catch {
    return false;
  }
}

export function useSidebarState(): {
  mode: SidebarStateMode;
  drawerOpen: boolean;
  toggleCollapsed: () => void;
  setDrawerOpen: (open: boolean) => void;
} {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [drawerOpen, setDrawerOpenState] = useState<boolean>(false);

  useEffect(() => {
    setCollapsed(readInitialCollapsed());
  }, []);

  useEffect(() => {
    const ls = getBrowserStorage();
    if (!ls) return;
    try {
      ls.setItem(STORAGE_KEY, JSON.stringify(collapsed));
    } catch {
      // Browser storage access denied; silently ignore.
    }
  }, [collapsed]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  const setDrawerOpen = useCallback((open: boolean) => {
    setDrawerOpenState(open);
  }, []);

  return {
    mode: collapsed ? "collapsed" : "expanded",
    drawerOpen,
    toggleCollapsed,
    setDrawerOpen,
  };
}
