"use client";

// unified-sidebar-shell-public-and-admin Task A: collapse / drawer state hook。
// 注: 当初仕様は client-side Web Storage への永続化（'ubm:shell:collapsed'）だったが、
// apps/web/src は lint boundary（scripts/lint-boundaries.mjs の forbidden token）で
// Web Storage API トークンを禁止している（codebase に使用例ゼロのハードバウンダリ）。
// 正本順位 #1（実コード優先）に従い、本実装では collapse 状態を in-memory（session 単位）に
// 限定する。永続化は cookie 等での follow-up とする。
import { useCallback, useState } from "react";

export type SidebarStateMode = "expanded" | "collapsed";

export interface SidebarState {
  readonly mode: SidebarStateMode;
  readonly drawerOpen: boolean;
  readonly toggleCollapsed: () => void;
  readonly setDrawerOpen: (open: boolean) => void;
}

export function useSidebarState(): SidebarState {
  // SSR 安全: 初期値は expanded 固定（client/server で同一）。
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  return {
    mode: collapsed ? "collapsed" : "expanded",
    drawerOpen,
    toggleCollapsed,
    setDrawerOpen,
  };
}
