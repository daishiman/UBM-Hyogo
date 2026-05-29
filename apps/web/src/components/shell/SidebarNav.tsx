"use client";

// unified-sidebar-shell-public-and-admin Task A: nav グループ列。
import { SidebarNavGroup } from "./SidebarNavGroup";
import type { ShellNavGroup } from "./shell-config";

export function SidebarNav({
  navGroups,
  activePath,
}: {
  readonly navGroups: ReadonlyArray<ShellNavGroup>;
  readonly activePath: string;
}) {
  return (
    <nav
      aria-label="サイドバー"
      data-component="shell-nav"
      className="flex flex-1 flex-col gap-4 overflow-y-auto"
    >
      {navGroups.map((group) => (
        <SidebarNavGroup key={group.id} group={group} activePath={activePath} />
      ))}
    </nav>
  );
}
