"use client";

// Task A — sidebar の expanded/collapsed を切り替える toggle。context 経由で操作する。
// md 未満（drawer 表示時）は不要なため hidden。
import { useSidebarShellContext } from "./SidebarShellContext";

export function SidebarCollapseToggle() {
  const { mode, toggleCollapsed } = useSidebarShellContext();
  const collapsed = mode === "collapsed";
  return (
    <button
      type="button"
      data-shell-block="collapse-toggle"
      aria-label={collapsed ? "サイドバーを展開" : "サイドバーを折りたたむ"}
      aria-expanded={collapsed ? "false" : "true"}
      onClick={toggleCollapsed}
      className="hidden items-center justify-center rounded-sm border border-[var(--ubm-color-border-default)] p-2 text-[var(--ubm-color-text-secondary)] hover:bg-[var(--shell-active-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ubm-color-accent)] md:inline-flex"
    >
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {collapsed ? <path d="M9 18l6-6-6-6" /> : <path d="M15 18l-6-6 6-6" />}
      </svg>
    </button>
  );
}
