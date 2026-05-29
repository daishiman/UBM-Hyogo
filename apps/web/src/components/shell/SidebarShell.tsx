"use client";

// unified-sidebar-shell-public-and-admin Task A: collapsible sidebar core（client）。
// 展開 272px / 折り畳み 64px。md 未満は aside hidden + drawer overlay（Task E）。
// shell は chrome（sidebar + content slot）を描画し、semantic <main> は呼出側 layout が持つ
//（main の二重化回避・admin-layout-sidebar-shell-migration phase-5 決定）。
// inline style は禁止（scripts/verify-no-inline-style.sh）のため幅は Tailwind arbitrary value
//（w-[var(--shell-bar-w)]）で表現する。
import type { ReactNode } from "react";
import { SidebarBrand } from "./SidebarBrand";
import { SidebarCollapseToggle } from "./SidebarCollapseToggle";
import { SidebarNav } from "./SidebarNav";
import { SidebarUserMenu } from "./SidebarUserMenu";
import { SidebarShellProvider } from "./SidebarShellContext";
import { useSidebarState } from "./useSidebarState";
import { cn } from "../../lib/cn";
import type { ShellNavGroup, ShellRole } from "./shell-config";

export type SidebarShellProps = {
  readonly role: ShellRole;
  readonly user: { readonly displayName: string; readonly email: string; readonly initials: string } | null;
  readonly navGroups: ReadonlyArray<ShellNavGroup>;
  readonly activePath: string;
  readonly mobileTriggerSlot: ReactNode;
  readonly children: ReactNode;
};

export function SidebarShell({
  role,
  user,
  navGroups,
  activePath,
  mobileTriggerSlot,
  children,
}: SidebarShellProps) {
  const state = useSidebarState();
  const collapsed = state.mode === "collapsed";

  return (
    <SidebarShellProvider value={state}>
      <div
        data-component="sidebar-shell"
        data-shell-collapsed={collapsed ? "true" : "false"}
        data-drawer-open={state.drawerOpen ? "true" : "false"}
        className="flex min-h-screen w-full"
      >
        <aside
          data-shell="sidebar"
          data-component="shell-sidebar"
          aria-label="サイドバー"
          className={cn(
            "hidden shrink-0 flex-col gap-4 border-r border-[var(--ubm-color-border-default)] bg-[var(--shell-bar-bg)] p-3 md:flex",
            collapsed ? "md:w-[var(--shell-bar-w-collapsed)]" : "md:w-[var(--shell-bar-w)]",
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <SidebarBrand />
            <SidebarCollapseToggle />
          </div>
          <SidebarNav navGroups={navGroups} activePath={activePath} />
          <SidebarUserMenu role={role} user={user} collapsed={collapsed} />
        </aside>

        {state.drawerOpen ? (
          <div data-component="shell-drawer" className="fixed inset-0 z-40 md:hidden">
            <button
              type="button"
              aria-label="メニューを閉じる"
              data-component="shell-drawer-scrim"
              onClick={() => state.setDrawerOpen(false)}
              className="absolute inset-0 bg-[var(--ubm-color-text-primary)] opacity-40"
            />
            <aside
              data-component="shell-drawer-panel"
              aria-label="サイドバー"
              className="absolute inset-y-0 left-0 flex w-[var(--shell-bar-w)] flex-col gap-4 border-r border-[var(--ubm-color-border-default)] bg-[var(--shell-bar-bg)] p-3"
            >
              <SidebarBrand />
              <SidebarNav navGroups={navGroups} activePath={activePath} />
              <SidebarUserMenu role={role} user={user} collapsed={false} />
            </aside>
          </div>
        ) : null}

        <div data-component="shell-content" className="flex min-w-0 flex-1 flex-col">
          <div
            data-component="shell-mobile-bar"
            className="flex items-center gap-2 border-b border-[var(--ubm-color-border-default)] px-3 py-2 md:hidden"
          >
            {mobileTriggerSlot}
          </div>
          {children}
        </div>
      </div>
    </SidebarShellProvider>
  );
}
