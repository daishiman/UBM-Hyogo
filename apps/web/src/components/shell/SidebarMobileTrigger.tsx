"use client";

import { useSidebarShellContext } from "./SidebarShellContext";

export function SidebarMobileTrigger() {
  const { drawerOpen, setDrawerOpen } = useSidebarShellContext();

  return (
    <button
      type="button"
      aria-label="サイドバーを開く"
      aria-controls="shell-drawer"
      aria-expanded={drawerOpen ? "true" : "false"}
      data-component="shell-mobile-trigger-button"
      className="inline-flex h-11 w-11 items-center justify-center rounded-sm border border-[var(--ubm-color-border-default)] bg-[var(--ubm-color-surface-panel)] text-[var(--ubm-color-text-primary)] shadow-xs hover:bg-[var(--ubm-color-surface-bg-2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ubm-color-accent)] md:hidden"
      onClick={() => setDrawerOpen(true)}
    >
      <span aria-hidden="true" className="flex flex-col gap-1">
        <span className="block h-0.5 w-5 rounded-sm bg-current" />
        <span className="block h-0.5 w-5 rounded-sm bg-current" />
        <span className="block h-0.5 w-5 rounded-sm bg-current" />
      </span>
    </button>
  );
}
