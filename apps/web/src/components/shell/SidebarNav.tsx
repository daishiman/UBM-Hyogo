"use client";

// unified-sidebar-shell / Task A: nav 本体（全グループ）。data-testid="shell-nav" は
// Task F smoke の nav item 件数検証アンカー。
import { SidebarNavGroup } from "./SidebarNavGroup";
import type { ShellNavGroup } from "./shell-config";

export function SidebarNav({
  navGroups,
  collapsed,
}: {
  readonly navGroups: ShellNavGroup[];
  readonly collapsed: boolean;
}) {
  return (
    <nav
      aria-label="サイドバー"
      data-testid="shell-nav"
      data-shell-block="nav"
      className="flex flex-1 flex-col gap-4 overflow-y-auto px-1 py-2"
    >
      {navGroups.map((group) => (
        <SidebarNavGroup key={group.id} group={group} collapsed={collapsed} />
      ))}
    </nav>
  );
}
