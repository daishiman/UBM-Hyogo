"use client";

// unified-sidebar-shell / Task A: nav グループ（ラベル + 項目リスト）。
import { SidebarNavItem } from "./SidebarNavItem";
import type { ShellNavGroup } from "./shell-config";

export function SidebarNavGroup({
  group,
  collapsed,
}: {
  readonly group: ShellNavGroup;
  readonly collapsed: boolean;
}) {
  return (
    <section data-shell-block="nav-group" data-group-id={group.id} className="flex flex-col gap-1">
      <div
        data-shell-block="nav-group-label"
        className={[
          "px-3 text-xs font-semibold uppercase tracking-wide text-[var(--ubm-color-text-muted)]",
          collapsed ? "sr-only" : "",
        ].join(" ")}
      >
        {group.label}
      </div>
      <ul className="flex flex-col gap-0.5">
        {group.items.map((item) => (
          <SidebarNavItem key={item.id} item={item} collapsed={collapsed} />
        ))}
      </ul>
    </section>
  );
}
