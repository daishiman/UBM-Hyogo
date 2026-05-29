"use client";

// unified-sidebar-shell-public-and-admin Task A: 展開/折り畳みトグル（md 以上で表示）。
import { useSidebarShell } from "./SidebarShellContext";

export function SidebarCollapseToggle() {
  const { mode, toggleCollapsed } = useSidebarShell();
  const collapsed = mode === "collapsed";
  return (
    <button
      type="button"
      data-component="shell-collapse-toggle"
      aria-label={collapsed ? "サイドバーを展開" : "サイドバーを折り畳む"}
      aria-expanded={!collapsed}
      onClick={toggleCollapsed}
      className="hidden h-8 w-8 items-center justify-center rounded-sm border border-[var(--ubm-color-border-default)] text-[var(--ubm-color-text-secondary)] hover:bg-[var(--ubm-color-surface-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ubm-color-accent)] md:inline-flex"
    >
      <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d={collapsed ? "M9 6l6 6-6 6" : "M15 6l-6 6 6 6"} />
      </svg>
    </button>
  );
}
