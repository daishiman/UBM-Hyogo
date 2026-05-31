"use client";

import type { ReactNode } from "react";
import { SidebarBrand } from "./SidebarBrand";
import { SidebarCollapseToggle } from "./SidebarCollapseToggle";
import { SidebarDrawer } from "./SidebarDrawer";
import { SidebarMobileTrigger } from "./SidebarMobileTrigger";
import { SidebarNav } from "./SidebarNav";
import { SidebarShellProvider } from "./SidebarShellContext";
import type { ShellNavGroup, ShellRole } from "./shell-config";
import { useSidebarState } from "./useSidebarState";

export type SidebarShellUser = {
  displayName: string;
  email: string;
  initials: string;
} | null;

export type SidebarShellProps = {
  role: ShellRole;
  user: SidebarShellUser;
  navGroups: ShellNavGroup[];
  activePath: string;
  mobileTriggerSlot?: ReactNode;
  userMenuSlot?: ReactNode;
  children: ReactNode;
};

export function SidebarShell({
  role,
  user,
  navGroups,
  activePath,
  mobileTriggerSlot,
  userMenuSlot,
  children,
}: SidebarShellProps) {
  const state = useSidebarState();
  const collapsed = state.mode === "collapsed";

  return (
    <SidebarShellProvider value={state}>
      <div
        data-component="shell-root"
        data-role={role}
        data-collapsed={collapsed ? "true" : "false"}
        className="flex min-h-screen w-full"
      >
        <aside
          data-component="shell-aside"
          data-collapsed={collapsed ? "true" : "false"}
          className="hidden w-[var(--shell-bar-w)] flex-shrink-0 flex-col gap-3 border-r bg-[var(--shell-bar-bg)] p-3 transition-[width] duration-150 data-[collapsed=true]:w-[var(--shell-bar-w-collapsed)] md:flex"
        >
          <div className="flex items-center justify-between gap-2">
            <SidebarBrand mode={state.mode} />
            <SidebarCollapseToggle />
          </div>
          <SidebarNav navGroups={navGroups} pathname={activePath} mode={state.mode} />
          <footer
            data-component="shell-sidebar-footer"
            className="flex flex-col gap-2 border-t border-[var(--shell-bar-border)] pt-3"
          >
            {userMenuSlot ?? (user ? <DefaultUserChip user={user} mode={state.mode} /> : null)}
          </footer>
        </aside>
        <div
          data-component="shell-mobile-trigger-strip"
          className="fixed left-3 top-3 z-40 md:hidden"
        >
          <SidebarMobileTrigger />
          {mobileTriggerSlot}
        </div>
        <SidebarDrawer open={state.drawerOpen} onClose={() => state.setDrawerOpen(false)}>
          <div className="flex items-center justify-between gap-2">
            <SidebarBrand mode="expanded" />
            <button
              type="button"
              aria-label="サイドバーを閉じる"
              className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-[var(--ubm-color-border-default)] bg-[var(--ubm-color-surface-panel)] text-[var(--ubm-color-text-primary)] hover:bg-[var(--ubm-color-surface-bg-2)]"
              onClick={() => state.setDrawerOpen(false)}
            >
              x
            </button>
          </div>
          <SidebarNav navGroups={navGroups} pathname={activePath} mode="expanded" />
          <footer
            data-component="shell-drawer-footer"
            className="mt-auto flex flex-col gap-2 border-t border-[var(--shell-bar-border)] pt-3"
          >
            {userMenuSlot ?? (user ? <DefaultUserChip user={user} mode="expanded" /> : null)}
          </footer>
        </SidebarDrawer>
        <main data-component="shell-main" className="flex flex-1 flex-col">
          {children}
        </main>
      </div>
    </SidebarShellProvider>
  );
}

function DefaultUserChip({
  user,
  mode,
}: {
  readonly user: NonNullable<SidebarShellUser>;
  readonly mode: "expanded" | "collapsed";
}) {
  const collapsed = mode === "collapsed";
  return (
    <div data-component="shell-user-chip" className="flex items-center gap-2 px-2">
      <span
        aria-hidden="true"
        className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[var(--ubm-color-surface-bg-2)] text-xs font-semibold text-[var(--ubm-color-text-primary)]"
      >
        {user.initials}
      </span>
      {!collapsed ? (
        <div className="flex min-w-0 flex-col leading-tight">
          <span
            data-component="shell-user-chip-name"
            className="truncate text-sm font-medium text-[var(--ubm-color-text-primary)]"
          >
            {user.displayName}
          </span>
          <span
            data-component="shell-user-chip-email"
            className="truncate text-xs text-[var(--ubm-color-text-secondary)]"
          >
            {user.email}
          </span>
        </div>
      ) : null}
    </div>
  );
}
