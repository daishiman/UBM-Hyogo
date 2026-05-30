"use client";

// unified-sidebar-shell / Task A: サイドバー上部のブランド。collapsed 時はマーク（U）のみ。
import Link from "next/link";

export function SidebarBrand({ collapsed }: { readonly collapsed: boolean }) {
  return (
    <Link
      href="/"
      data-shell-block="brand"
      className="flex items-center gap-2 px-3 py-2 text-[var(--ubm-color-text-primary)]"
      aria-label="UBM 兵庫支部会 ホーム"
    >
      <span
        aria-hidden="true"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--ubm-color-accent-soft)] text-sm font-bold text-[var(--ubm-color-accent-ink)]"
      >
        U
      </span>
      <span className={collapsed ? "sr-only" : "truncate text-sm font-semibold"}>
        UBM 兵庫支部会
      </span>
    </Link>
  );
}
