"use client";

import { useCallback } from "react";
import type { ReactNode } from "react";
import { Avatar } from "../ui/Avatar";
import { SignOutButton } from "../auth/SignOutButton";
import { SidebarBrand } from "./SidebarBrand";
import { SidebarCollapseToggle } from "./SidebarCollapseToggle";
import { SidebarDrawer } from "./SidebarDrawer";
import { SidebarNav } from "./SidebarNav";
import { SidebarShellProvider, useSidebarShellContext } from "./SidebarShellContext";
import type { ShellNavGroup, ShellRole } from "./shell-config";

export type SidebarShellUser = {
  displayName: string;
  email: string;
  initials: string;
};

export type SidebarShellProps = {
  role: ShellRole;
  user: SidebarShellUser | null;
  navGroups: ShellNavGroup[];
  activePath: string;
  /** Task E が `<SidebarMobileTrigger />` を埋める hosting point。 */
  mobileTriggerSlot: ReactNode;
  children: ReactNode;
};

export function SidebarShell(props: SidebarShellProps) {
  // state owner（useSidebarState）は provider 1 箇所に閉じ、子孫は context 経由で読む（I-E2）。
  return (
    <SidebarShellProvider>
      <SidebarShellInner {...props} />
    </SidebarShellProvider>
  );
}

function SidebarFooter({ user, collapsed }: { user: SidebarShellUser | null; collapsed: boolean }) {
  if (!user) return null;
  return (
    <footer
      data-component="shell-footer"
      className="flex flex-col gap-2 border-t border-[var(--shell-bar-border)] pt-3"
    >
      <div data-component="shell-user-chip" className="flex items-center gap-2 px-3">
        <Avatar size="sm" name={user.displayName} />
        {!collapsed ? (
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-medium text-[var(--shell-fg)]">
              {user.displayName}
            </span>
            <span className="truncate text-xs text-[var(--ubm-color-text-secondary)]">
              {user.email}
            </span>
          </div>
        ) : null}
      </div>
      {!collapsed ? <SignOutButton /> : null}
    </footer>
  );
}

function SidebarShellInner({ user, navGroups, mobileTriggerSlot, children }: SidebarShellProps) {
  const { mode, drawerOpen, setDrawerOpen } = useSidebarShellContext();
  const collapsed = mode === "collapsed";
  const closeDrawer = useCallback(() => setDrawerOpen(false), [setDrawerOpen]);

  // <aside> 内と drawer 内で共有する nav ツリー（重複 component 定義を避け、固定 id も置かない・R-E2）。
  const sidebarTree = (
    <div className="flex h-full flex-col gap-4 p-3" data-shell-block="sidebar-nav">
      <div className="flex items-center justify-between">
        <SidebarBrand collapsed={collapsed} />
        <div className="hidden md:block">
          <SidebarCollapseToggle />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
        <SidebarNav navGroups={navGroups} collapsed={collapsed} />
      </div>
      <SidebarFooter user={user} collapsed={collapsed} />
    </div>
  );

  return (
    <div
      className="flex min-h-screen bg-[var(--ubm-color-surface-bg)] text-[var(--shell-fg)]"
      data-shell-mode={collapsed ? "collapsed" : "expanded"}
    >
      {/* md+: 表示 / sm: hidden（AC-E1）。幅は token で expanded / collapsed を切替。 */}
      <aside
        className="hidden md:flex md:flex-col shrink-0 border-r border-[var(--shell-bar-border)] bg-[var(--shell-bar-bg)]"
        style={{ width: collapsed ? "var(--shell-bar-w-collapsed)" : "var(--shell-bar-w)" }}
        data-shell="sidebar"
      >
        {sidebarTree}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* sm のみ visible な上部 56px ストリップ（AC-E1） */}
        <div className="md:hidden flex h-14 items-center gap-2 border-b border-[var(--shell-bar-border)] bg-[var(--shell-bar-bg)] px-2">
          {mobileTriggerSlot}
        </div>
        <main className="min-w-0 flex-1">{children}</main>
      </div>

      {/* overlay drawer（sm のみ・md+ では wrapper の md:hidden + unmount で出さない） */}
      <SidebarDrawer open={drawerOpen} onClose={closeDrawer}>
        {sidebarTree}
      </SidebarDrawer>
    </div>
  );
}
