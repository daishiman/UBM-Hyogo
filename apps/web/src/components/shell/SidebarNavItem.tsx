"use client";

import Link from "next/link";
import { ShellIcon } from "./icons";
import { isNavItemActive, type ShellNavItem } from "./shell-config";
import type { SidebarStateMode } from "./useSidebarState";

export function SidebarNavItem({
  item,
  pathname,
  mode,
}: {
  readonly item: ShellNavItem;
  readonly pathname: string;
  readonly mode: SidebarStateMode;
}) {
  const active = isNavItemActive(item.href, pathname);
  const collapsed = mode === "collapsed";
  const badge = item.badge && item.badge.count > 0 ? item.badge : null;
  return (
    <li>
      <Link
        href={item.href}
        data-component="shell-nav-item"
        data-active={active ? "true" : "false"}
        data-collapsed={collapsed ? "true" : "false"}
        aria-current={active ? "page" : undefined}
        className="flex items-center gap-2 rounded-sm px-3 py-2 text-sm text-[var(--ubm-color-text-primary)] hover:bg-[var(--ubm-color-surface-bg-2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ubm-color-accent)] data-[active=true]:bg-[var(--shell-active-bg)] data-[active=true]:font-semibold data-[active=true]:text-[var(--ubm-color-accent-ink)]"
      >
        <span
          data-component="shell-nav-icon"
          className="inline-flex h-4 w-4 flex-shrink-0 items-center justify-center"
        >
          <ShellIcon id={item.icon} />
        </span>
        <span
          data-component="shell-nav-label"
          className={collapsed ? "sr-only" : "flex-1 truncate"}
        >
          {item.label}
        </span>
        {badge && !collapsed ? (
          <span
            data-component="shell-nav-badge"
            data-tone={badge.tone}
            className="inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold data-[tone=warn]:bg-[var(--ubm-color-warn-soft)] data-[tone=warn]:text-[var(--ubm-color-warn)] data-[tone=danger]:bg-[var(--ubm-color-danger-soft)] data-[tone=danger]:text-[var(--ubm-color-danger)] data-[tone=info]:bg-[var(--ubm-color-info-soft)] data-[tone=info]:text-[var(--ubm-color-info)]"
          >
            {badge.count}
          </span>
        ) : null}
      </Link>
    </li>
  );
}
