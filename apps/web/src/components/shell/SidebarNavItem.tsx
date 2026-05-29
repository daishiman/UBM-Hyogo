"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Chip } from "../ui/Chip";
import type { ChipTone } from "../../lib/tones";
import { NavIcon } from "./icons";
import { isNavItemActive, type ShellBadgeTone, type ShellNavItem } from "./shell-config";

const BADGE_TONE_TO_CHIP: Record<ShellBadgeTone, ChipTone> = {
  warn: "amber",
  danger: "red",
  info: "cool",
};

export interface SidebarNavItemProps {
  readonly item: ShellNavItem;
  readonly collapsed: boolean;
}

export function SidebarNavItem({ item, collapsed }: SidebarNavItemProps) {
  const pathname = usePathname() ?? "";
  const active = isNavItemActive(item.href, pathname);
  const showBadge = !collapsed && item.badge !== undefined && item.badge.count > 0;
  return (
    <li>
      <Link
        href={item.href}
        data-active={active ? "true" : "false"}
        data-component="shell-nav-item"
        aria-current={active ? "page" : undefined}
        title={collapsed ? item.label : undefined}
        className="flex items-center gap-2 rounded-sm px-3 py-2 text-sm text-[var(--shell-fg)] hover:bg-[var(--ubm-color-surface-hover,var(--ubm-color-surface-bg-2))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ubm-color-accent)] data-[active=true]:bg-[var(--shell-active-bg)] data-[active=true]:font-semibold data-[active=true]:text-[var(--shell-active-fg)]"
      >
        <span
          data-component="shell-nav-icon"
          aria-hidden="true"
          className="inline-flex h-4 w-4 shrink-0 items-center justify-center"
        >
          <NavIcon name={item.icon} />
        </span>
        <span className={collapsed ? "sr-only" : "flex-1 truncate"}>{item.label}</span>
        {showBadge ? <Chip tone={BADGE_TONE_TO_CHIP[item.badge!.tone]}>{item.badge!.count}</Chip> : null}
      </Link>
    </li>
  );
}
