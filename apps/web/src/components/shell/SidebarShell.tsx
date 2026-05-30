"use client";

// unified-sidebar-shell / Task A + E: 3 層共通の collapsible Sidebar Shell（client）。
// - 左の persistent sidebar（md+、collapsed/expanded）
// - mobile（< md）は hamburger → overlay drawer
// - 左下に UserMenu（ロール別 action）
import type { ReactNode } from "react";
import { SidebarBrand } from "./SidebarBrand";
import { SidebarCollapseToggle } from "./SidebarCollapseToggle";
import { SidebarDrawer } from "./SidebarDrawer";
import { SidebarNav } from "./SidebarNav";
import { SidebarShellProvider } from "./SidebarShellContext";
import { SidebarUserMenu } from "./SidebarUserMenu";
import { useSidebarState } from "./useSidebarState";
import type { ShellNavGroup, ShellRole } from "./shell-config";

export type SidebarShellProps = {
  role: ShellRole;
  user: { displayName: string; email: string; initials: string } | null;
  navGroups: ShellNavGroup[];
  // active 判定は SidebarNavItem の usePathname（client）が担うため activePath prop は持たない。
  mobileTriggerSlot: ReactNode;
  children: ReactNode;
};

export function SidebarShell({
  role,
  user,
  navGroups,
  mobileTriggerSlot,
  children,
}: SidebarShellProps) {
  const { collapsed, drawerOpen, toggleCollapsed, setDrawerOpen } = useSidebarState();

  const sidebarInner = (
    <>
      <div className="flex items-center justify-between gap-1 px-1 pt-2">
        <SidebarBrand collapsed={collapsed} />
        <span className="hidden md:block">
          <SidebarCollapseToggle />
        </span>
      </div>
      <SidebarNav navGroups={navGroups} collapsed={collapsed} />
      <SidebarUserMenu role={role} user={user} collapsed={collapsed} />
    </>
  );

  return (
    <SidebarShellProvider value={{ collapsed, drawerOpen, toggleCollapsed, setDrawerOpen }}>
      <div
        data-testid="app-shell"
        data-shell="app-shell"
        data-role={role}
        data-collapsed={collapsed ? "true" : "false"}
        className="flex min-h-screen bg-[var(--ubm-color-surface-bg)] text-[var(--ubm-color-text-primary)]"
      >
        {/* persistent sidebar（md+） */}
        <aside
          data-testid="shell-sidebar"
          data-shell="sidebar"
          data-collapsed={collapsed ? "true" : "false"}
          className={`hidden shrink-0 flex-col border-r border-[var(--shell-bar-border)] bg-[var(--shell-bar-bg)] md:flex ${
            collapsed ? "w-[var(--shell-bar-w-collapsed)]" : "w-[var(--shell-bar-w)]"
          }`}
        >
          {sidebarInner}
        </aside>

        {/* main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* mobile top strip with hamburger（< md） */}
          <div
            data-shell="mobile-strip"
            className="flex h-14 items-center gap-2 border-b border-[var(--shell-bar-border)] bg-[var(--shell-bar-bg)] px-3 md:hidden"
          >
            {mobileTriggerSlot}
            <SidebarBrand collapsed={false} />
          </div>
          <main data-shell="main" className="min-w-0 flex-1">
            {children}
          </main>
        </div>

        {/* mobile overlay drawer */}
        <SidebarDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
          <div className="flex flex-1 flex-col">{sidebarInner}</div>
        </SidebarDrawer>
      </div>
    </SidebarShellProvider>
  );
}
