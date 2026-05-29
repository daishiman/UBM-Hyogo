"use client";

// unified-sidebar-shell-public-and-admin Task A: 1 nav item。active 判定は client usePathname() 経由。
// activePath は SSR 初期表示 / test の seed（x-pathname 方式は不採用）。
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Chip } from "../ui/Chip";
import type { ChipTone } from "../../lib/tones";
import { ShellIcon } from "./icons";
import { isNavItemActive, type ShellNavBadgeTone, type ShellNavItem } from "./shell-config";
import { useSidebarShell } from "./SidebarShellContext";

const TONE_TO_CHIP: Record<ShellNavBadgeTone, ChipTone> = {
  warn: "amber",
  danger: "red",
  info: "cool",
};

export function SidebarNavItem({
  item,
  activePath,
}: {
  readonly item: ShellNavItem;
  readonly activePath: string;
}) {
  const { mode, setDrawerOpen } = useSidebarShell();
  const pathname = usePathname() ?? activePath;
  const active = isNavItemActive(item.href, pathname);
  const collapsed = mode === "collapsed";
  const badge = item.badge && item.badge.count > 0 ? item.badge : null;

  return (
    <li>
      <Link
        href={item.href}
        data-active={active ? "true" : "false"}
        data-component="shell-nav-item"
        aria-current={active ? "page" : undefined}
        title={collapsed ? item.label : undefined}
        onClick={() => setDrawerOpen(false)}
        className="flex items-center gap-2 rounded-sm px-3 py-2 text-sm text-[var(--ubm-color-text-primary)] hover:bg-[var(--ubm-color-surface-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ubm-color-accent)] data-[active=true]:bg-[var(--ubm-color-surface-active)] data-[active=true]:font-semibold data-[active=true]:text-[var(--ubm-color-accent)]"
      >
        <span
          data-component="shell-nav-icon"
          aria-hidden="true"
          className="inline-flex h-4 w-4 shrink-0 items-center justify-center"
        >
          <ShellIcon id={item.icon} />
        </span>
        <span className={collapsed ? "sr-only" : "flex-1"}>{item.label}</span>
        {badge ? <Chip tone={TONE_TO_CHIP[badge.tone]}>{badge.count}</Chip> : null}
      </Link>
    </li>
  );
}
