"use client";

// Task E — モバイル用 hamburger trigger。md+ では hidden。context 経由で drawer を開く。
import { useSidebarShellContext } from "./SidebarShellContext";

export function SidebarMobileTrigger() {
  const { setDrawerOpen } = useSidebarShellContext();
  return (
    <button
      type="button"
      data-shell-block="mobile-trigger"
      aria-label="メニューを開く"
      aria-haspopup="dialog"
      onClick={() => setDrawerOpen(true)}
      className="inline-flex items-center justify-center rounded-sm border border-[var(--ubm-color-border-default)] p-2 text-[var(--ubm-color-text-primary)] hover:bg-[var(--shell-active-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ubm-color-accent)] md:hidden"
    >
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3 6h18M3 12h18M3 18h18" />
      </svg>
    </button>
  );
}
