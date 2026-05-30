"use client";

import { SidebarNavGroup } from "./SidebarNavGroup";
import type { ShellNavGroup } from "./shell-config";
import type { SidebarStateMode } from "./useSidebarState";

export function SidebarNav({
  navGroups,
  pathname,
  mode,
}: {
  readonly navGroups: ShellNavGroup[];
  readonly pathname: string;
  readonly mode: SidebarStateMode;
}) {
  return (
    <nav
      aria-label="サイドバー"
      data-component="shell-nav"
      className="flex flex-1 flex-col gap-4 overflow-y-auto"
    >
      {navGroups.map((group) => (
        <SidebarNavGroup key={group.id} group={group} pathname={pathname} mode={mode} />
      ))}
    </nav>
  );
}
