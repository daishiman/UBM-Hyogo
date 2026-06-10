"use client";

// Task A — sidebar の 1 nav item。active 判定は client の usePathname を正本とし、
// SSR 初期 active は activePath fallback で graceful degradation する。
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Chip } from "../ui/Chip";
import { ShellIcon } from "./icons";
import { SidebarTooltip } from "./SidebarTooltip";
import { isNavItemActive, type ShellNavItem } from "./shell-config";

const TONE_TO_CHIP: Record<"warn" | "danger" | "info", "warning" | "danger" | "info"> = {
  warn: "warning",
  danger: "danger",
  info: "info",
};

export interface SidebarNavItemProps {
  readonly item: ShellNavItem;
  readonly collapsed: boolean;
  /** SSR / context 不在時の active 判定 fallback（layout から渡る x-pathname or 既定値）。 */
  readonly activePath: string;
}

export function SidebarNavItem({ item, collapsed, activePath }: SidebarNavItemProps) {
  const pathname = usePathname() ?? activePath;
  const active = isNavItemActive(item.href, pathname);
  const showBadge = item.badge && item.badge.count > 0;
  const itemClassName = `relative flex items-center rounded-sm py-2 text-sm text-[var(--ubm-color-text-primary)] hover:bg-[var(--shell-active-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ubm-color-accent)] ${collapsed ? "w-full justify-center gap-0 px-0" : "gap-3 px-3"}`;
  const content = (
    <>
      <span
        aria-hidden="true"
        className={`inline-flex shrink-0 items-center justify-center text-[var(--ubm-color-text-secondary)] ${collapsed ? "h-10 w-10" : "h-[18px] w-[18px]"}`}
      >
        <ShellIcon id={item.icon} />
      </span>
      <span className={collapsed ? "sr-only" : "flex-1"}>
        {item.label}
        {item.external ? <span className="sr-only">（外部リンク）</span> : null}
      </span>
      {item.external && !collapsed ? (
        <span aria-hidden="true" className="text-xs text-[var(--ubm-color-text-muted)]">
          ↗
        </span>
      ) : null}
      {showBadge && item.badge && collapsed ? (
        <span
          data-shell-block="nav-badge-dot"
          className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[var(--ubm-color-accent-ink)]"
        >
          <span className="sr-only">{item.badge.count}</span>
        </span>
      ) : null}
      {showBadge && item.badge && !collapsed ? (
        <Chip tone={TONE_TO_CHIP[item.badge.tone]}>
          <span className="font-semibold">{item.badge.count}</span>
        </Chip>
      ) : null}
    </>
  );
  if (item.external) {
    return (
      <li className="w-full">
        <SidebarTooltip label={item.label} collapsed={collapsed}>
          <a
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            data-shell-block="nav-item"
            className={itemClassName}
          >
            {content}
          </a>
        </SidebarTooltip>
      </li>
    );
  }
  return (
    <li className="w-full">
      <SidebarTooltip label={item.label} collapsed={collapsed}>
        <Link
          href={item.href}
          data-shell-block="nav-item"
          data-active={active ? "true" : "false"}
          aria-current={active ? "page" : undefined}
          className={`${itemClassName} border-l-2 border-transparent data-[active=true]:border-[var(--ubm-color-accent)] data-[active=true]:bg-[var(--shell-active-bg)] data-[active=true]:font-semibold data-[active=true]:text-[var(--ubm-color-accent-ink)]`}
        >
          {content}
        </Link>
      </SidebarTooltip>
    </li>
  );
}
