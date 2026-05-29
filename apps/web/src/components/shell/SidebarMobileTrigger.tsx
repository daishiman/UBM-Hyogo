"use client";

// unified-sidebar-shell-public-and-admin Task E（最小）: mobileTriggerSlot に注入する drawer 起動ボタン。
// SidebarShell の context 内でのみ描画される（drawer open setter を context 経由で叩く）。
import { useSidebarShell } from "./SidebarShellContext";

export function SidebarMobileTrigger() {
  const { drawerOpen, setDrawerOpen } = useSidebarShell();
  return (
    <button
      type="button"
      data-component="shell-mobile-trigger"
      aria-label="メニューを開く"
      aria-expanded={drawerOpen}
      onClick={() => setDrawerOpen(true)}
      className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-[var(--ubm-color-border-default)] text-[var(--ubm-color-text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ubm-color-accent)]"
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
