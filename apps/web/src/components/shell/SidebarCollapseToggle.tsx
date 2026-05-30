"use client";

import { useSidebarShellContext } from "./SidebarShellContext";

export function SidebarCollapseToggle() {
  const { mode, toggleCollapsed } = useSidebarShellContext();
  const expanded = mode === "expanded";
  return (
    <button
      type="button"
      data-component="shell-collapse-toggle"
      data-collapsed={expanded ? "false" : "true"}
      aria-expanded={expanded}
      aria-label={expanded ? "サイドバーを折り畳む" : "サイドバーを展開する"}
      onClick={toggleCollapsed}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--ubm-color-text-secondary)] hover:bg-[var(--ubm-color-surface-bg-2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ubm-color-accent)]"
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
        {expanded ? <path d="M15 6l-6 6 6 6" /> : <path d="M9 6l6 6-6 6" />}
      </svg>
    </button>
  );
}
