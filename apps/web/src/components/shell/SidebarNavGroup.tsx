"use client";

// unified-sidebar-shell-public-and-admin Task A: nav グループ（Public / Members / Admin）。
// collapsed 時はグループラベルを sr-only にして icon 列のみ残す。
import { SidebarNavItem } from "./SidebarNavItem";
import type { ShellNavGroup } from "./shell-config";
import { useSidebarShell } from "./SidebarShellContext";

export function SidebarNavGroup({
  group,
  activePath,
}: {
  readonly group: ShellNavGroup;
  readonly activePath: string;
}) {
  const { mode } = useSidebarShell();
  const collapsed = mode === "collapsed";
  return (
    <section data-component="shell-nav-section" data-group={group.id} className="flex flex-col gap-1">
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
          <SidebarNavItem key={item.id} item={item} activePath={activePath} />
        ))}
      </ul>
    </section>
  );
}
