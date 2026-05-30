"use client";

import { SidebarNavItem } from "./SidebarNavItem";
import type { ShellNavGroup } from "./shell-config";
import type { SidebarStateMode } from "./useSidebarState";

export function SidebarNavGroup({
  group,
  pathname,
  mode,
}: {
  readonly group: ShellNavGroup;
  readonly pathname: string;
  readonly mode: SidebarStateMode;
}) {
  const collapsed = mode === "collapsed";
  return (
    <section
      data-component="shell-nav-group"
      data-group-id={group.id}
      className="flex flex-col gap-1"
    >
      <div
        data-component="shell-nav-group-label"
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
          <SidebarNavItem key={item.id} item={item} pathname={pathname} mode={mode} />
        ))}
      </ul>
    </section>
  );
}
