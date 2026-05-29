"use client";

import { useSidebarShellContext } from "./SidebarShellContext";
import { MenuIcon } from "./icons";

/**
 * mobile（`< md`）の hamburger trigger（Task E）。
 * md+ では `md:hidden` で非表示。自前 state を持たず context の setDrawerOpen(true) のみ呼ぶ（I-E2）。
 */
export function SidebarMobileTrigger() {
  const { setDrawerOpen } = useSidebarShellContext();
  return (
    <button
      type="button"
      className="md:hidden inline-flex h-11 w-11 items-center justify-center rounded-md text-[var(--shell-fg)] hover:bg-[var(--ubm-color-surface-hover,var(--ubm-color-surface-bg-2))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ubm-color-accent)]"
      aria-label="メニューを開く"
      aria-haspopup="dialog"
      onClick={() => setDrawerOpen(true)}
    >
      <MenuIcon aria-hidden="true" />
    </button>
  );
}
