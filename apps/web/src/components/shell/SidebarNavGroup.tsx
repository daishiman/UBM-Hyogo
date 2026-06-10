"use client";

// Task A — nav グループ（公開 / 会員 / 管理）。collapsed 時はグループ label を sr-only にする。
import { SidebarNavItem } from "./SidebarNavItem";
import type { ShellNavGroup } from "./shell-config";

export interface SidebarNavGroupProps {
  readonly group: ShellNavGroup;
  readonly collapsed: boolean;
  readonly activePath: string;
}

export function SidebarNavGroup({ group, collapsed, activePath }: SidebarNavGroupProps) {
  return (
    <section data-shell-block="nav-group" data-group={group.id} className="flex w-full flex-col gap-1">
      <div
        data-shell-block="nav-group-label"
        className={
          collapsed
            ? "sr-only"
            : "px-3 pt-2 text-xs font-semibold uppercase tracking-wide text-[var(--ubm-color-text-secondary)]"
        }
      >
        {group.label}
      </div>
      <ul className="m-0 flex w-full list-none flex-col gap-0.5 p-0">
        {group.items.map((item) => (
          <SidebarNavItem
            key={item.id}
            item={item}
            collapsed={collapsed}
            activePath={activePath}
          />
        ))}
      </ul>
    </section>
  );
}
