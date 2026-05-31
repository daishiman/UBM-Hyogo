"use client";

// Task A — sidebar 上部のブランドブロック。/ へのリンク。collapsed 時はマークのみ表示。
import Link from "next/link";

export interface SidebarBrandProps {
  readonly collapsed: boolean;
}

export function SidebarBrand({ collapsed }: SidebarBrandProps) {
  return (
    <Link
      href="/"
      aria-label="UBM 兵庫支部会 ホームへ"
      data-shell-block="brand"
      className="flex items-center gap-2 rounded-sm px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ubm-color-accent)]"
    >
      <span
        aria-hidden="true"
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-[var(--ubm-color-border-default)] text-sm font-bold text-[var(--ubm-color-accent-ink)]"
      >
        U
      </span>
      <span className={collapsed ? "sr-only" : "flex flex-col leading-tight"}>
        <span className="text-sm font-semibold text-[var(--ubm-color-text-primary)]">
          UBM兵庫
        </span>
        <span className="text-xs text-[var(--ubm-color-text-secondary)]">支部会メンバー</span>
      </span>
    </Link>
  );
}
