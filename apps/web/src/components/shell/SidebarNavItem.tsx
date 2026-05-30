"use client";

// unified-sidebar-shell / Task A: nav 1 項目。active は client の usePathname で判定。
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShellNavIcon } from "./icons";
import { isNavItemActive, type ShellNavItem } from "./shell-config";
import { useSidebarShellContext } from "./SidebarShellContext";

export function SidebarNavItem({
  item,
  collapsed,
}: {
  readonly item: ShellNavItem;
  readonly collapsed: boolean;
}) {
  const pathname = usePathname() ?? "/";
  const active = isNavItemActive(item.href, pathname);
  const { setDrawerOpen } = useSidebarShellContext();
  return (
    <li>
      <Link
        href={item.href}
        data-shell-block="nav-item"
        data-active={active ? "true" : undefined}
        aria-current={active ? "page" : undefined}
        title={collapsed ? item.label : undefined}
        onClick={() => setDrawerOpen(false)}
        className={[
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm",
          active
            ? "bg-[var(--shell-active-bg)] font-medium text-[var(--ubm-color-text-primary)]"
            : "text-[var(--ubm-color-text-secondary)] hover:bg-[var(--ubm-color-surface-bg-2)]",
        ].join(" ")}
      >
        <span aria-hidden="true" className="shrink-0">
          <ShellNavIcon id={item.icon} />
        </span>
        <span className={collapsed ? "sr-only" : "flex-1 truncate"}>{item.label}</span>
        {item.badge && item.badge.count > 0 ? (
          <span
            data-shell-block="nav-badge"
            data-tone={item.badge.tone}
            className={[
              "ml-auto inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold",
              collapsed ? "sr-only" : "",
              "bg-[var(--ubm-color-warn-soft)] text-[var(--ubm-color-warn)]",
            ].join(" ")}
          >
            {item.badge.count}
          </span>
        ) : null}
      </Link>
    </li>
  );
}
