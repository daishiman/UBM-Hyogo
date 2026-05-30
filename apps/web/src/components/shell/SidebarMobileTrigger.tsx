"use client";

// unified-sidebar-shell / Task E: モバイル用 hamburger。md+ では hidden。
import { MenuIcon } from "./icons";
import { useSidebarShellContext } from "./SidebarShellContext";

export function SidebarMobileTrigger() {
  const { setDrawerOpen } = useSidebarShellContext();
  return (
    <button
      type="button"
      data-testid="shell-drawer-toggle"
      data-shell-block="drawer-toggle"
      onClick={() => setDrawerOpen(true)}
      aria-label="メニューを開く"
      aria-haspopup="dialog"
      className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[var(--ubm-color-text-primary)] hover:bg-[var(--ubm-color-surface-bg-2)] md:hidden"
    >
      <MenuIcon />
    </button>
  );
}
