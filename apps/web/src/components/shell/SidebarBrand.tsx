"use client";

import type { SidebarStateMode } from "./useSidebarState";

export function SidebarBrand({ mode }: { readonly mode: SidebarStateMode }) {
  const collapsed = mode === "collapsed";
  return (
    <div
      data-component="sidebar-brand"
      data-collapsed={collapsed ? "true" : "false"}
      className="flex items-center gap-2 px-3 py-2"
    >
      <span
        aria-hidden="true"
        className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[var(--ubm-color-accent-soft)] text-sm font-bold text-[var(--ubm-color-accent-ink)]"
      >
        U
      </span>
      {collapsed ? (
        <span className="sr-only">UBM 兵庫</span>
      ) : (
        <span className="text-sm font-semibold text-[var(--ubm-color-text-primary)]">
          UBM 兵庫
        </span>
      )}
    </div>
  );
}
