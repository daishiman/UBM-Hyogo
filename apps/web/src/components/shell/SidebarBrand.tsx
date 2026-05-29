"use client";

import Link from "next/link";

export interface SidebarBrandProps {
  readonly collapsed: boolean;
}

export function SidebarBrand({ collapsed }: SidebarBrandProps) {
  return (
    <Link
      href="/"
      aria-label="UBM兵庫 ホームに戻る"
      data-component="shell-brand"
      className="flex items-center gap-2 rounded-sm px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ubm-color-accent)]"
    >
      <span
        data-component="shell-brand-mark"
        aria-hidden="true"
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-[var(--shell-bar-border)] text-sm font-bold text-[var(--ubm-color-accent)]"
      >
        U
      </span>
      <span className={collapsed ? "sr-only" : "flex flex-col leading-tight"}>
        <span data-component="shell-brand-title" className="text-sm font-semibold text-[var(--shell-fg)]">
          UBM兵庫
        </span>
        <span data-component="shell-brand-subtitle" className="text-xs text-[var(--ubm-color-text-secondary)]">
          メンバーサイト
        </span>
      </span>
    </Link>
  );
}
