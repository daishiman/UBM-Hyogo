"use client";

import { SidebarNavItem } from "./SidebarNavItem";
import type { ShellNavGroup } from "./shell-config";

export interface SidebarNavGroupProps {
  readonly group: ShellNavGroup;
  readonly collapsed: boolean;
}

export function SidebarNavGroup({ group, collapsed }: SidebarNavGroupProps) {
  return (
    <section data-component="shell-nav-section" className="flex flex-col gap-1">
      <div
        data-component="shell-nav-label"
        className={
          collapsed
            ? "sr-only"
            : "px-3 text-xs font-semibold uppercase tracking-wide text-[var(--ubm-color-text-secondary)]"
        }
      >
        {group.label}
      </div>
      <ul className="flex flex-col gap-0.5">
        {group.items.map((item) => (
          <SidebarNavItem key={item.href} item={item} collapsed={collapsed} />
        ))}
      </ul>
    </section>
  );
}
