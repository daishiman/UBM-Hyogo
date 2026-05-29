"use client";

import { SidebarNavGroup } from "./SidebarNavGroup";
import type { ShellNavGroup } from "./shell-config";

export interface SidebarNavProps {
  readonly navGroups: ShellNavGroup[];
  readonly collapsed: boolean;
}

export function SidebarNav({ navGroups, collapsed }: SidebarNavProps) {
  return (
    <nav aria-label="サイドバー" className="flex flex-col gap-4">
      {navGroups.map((group) => (
        <SidebarNavGroup key={group.id} group={group} collapsed={collapsed} />
      ))}
    </nav>
  );
}
