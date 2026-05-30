"use client";

// unified-sidebar-shell / Task A: collapse/expand トグル。context 経由で状態変更。
import { CollapseIcon, ExpandIcon } from "./icons";
import { useSidebarShellContext } from "./SidebarShellContext";

export function SidebarCollapseToggle() {
  const { collapsed, toggleCollapsed } = useSidebarShellContext();
  return (
    <button
      type="button"
      data-testid="shell-collapse-toggle"
      data-shell-block="collapse-toggle"
      onClick={toggleCollapsed}
      aria-expanded={!collapsed}
      aria-label={collapsed ? "サイドバーを展開" : "サイドバーを折り畳む"}
      className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--ubm-color-text-secondary)] hover:bg-[var(--ubm-color-surface-bg-2)]"
    >
      {collapsed ? <ExpandIcon /> : <CollapseIcon />}
    </button>
  );
}
