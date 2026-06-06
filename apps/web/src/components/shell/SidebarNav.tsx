"use client";

// Task A — sidebar nav 全体。`<nav aria-label="サイドバー">` ランドマークを所有する。
import { SidebarNavGroup } from "./SidebarNavGroup";
import type { ShellNavGroup } from "./shell-config";

export interface SidebarNavProps {
  readonly navGroups: ReadonlyArray<ShellNavGroup>;
  readonly collapsed: boolean;
  readonly activePath: string;
}

export function SidebarNav({ navGroups, collapsed, activePath }: SidebarNavProps) {
  return (
    <nav
      aria-label="サイドバー"
      data-shell-block="nav"
      className={`flex flex-1 flex-col gap-3 ${collapsed ? "overflow-visible" : "overflow-y-auto"}`}
    >
      {navGroups.map((group) => (
        <SidebarNavGroup
          key={group.id}
          group={group}
          collapsed={collapsed}
          activePath={activePath}
        />
      ))}
    </nav>
  );
}
