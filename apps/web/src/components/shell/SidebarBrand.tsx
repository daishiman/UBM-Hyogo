"use client";

// unified-sidebar-shell-public-and-admin Task A: shell ブランドブロック（旧 AdminBrandBlock の role-neutral 版）。
import Link from "next/link";
import { useSidebarShell } from "./SidebarShellContext";

export function SidebarBrand() {
  const { mode } = useSidebarShell();
  const collapsed = mode === "collapsed";
  return (
    <Link
      href="/"
      aria-label="ホームに戻る"
      data-component="shell-brand"
      className="flex items-center gap-2 rounded-sm px-1 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ubm-color-accent)]"
    >
      <span
        data-component="shell-brand-mark"
        aria-hidden="true"
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-[var(--ubm-color-border-default)] text-sm font-bold text-[var(--ubm-color-accent)]"
      >
        U
      </span>
      <span className={collapsed ? "sr-only" : "flex flex-col leading-tight"}>
        <span
          data-component="shell-brand-title"
          className="text-sm font-semibold text-[var(--ubm-color-text-primary)]"
        >
          UBM兵庫
        </span>
        <span
          data-component="shell-brand-subtitle"
          className="text-xs text-[var(--ubm-color-text-secondary)]"
        >
          メンバーサイト
        </span>
      </span>
    </Link>
  );
}
