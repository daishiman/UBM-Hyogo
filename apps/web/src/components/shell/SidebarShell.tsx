"use client";

// Task A — collapsible sidebar shell core (Client)。
// 公開 / 会員 / 管理の 3 層で共有する shell。drawer / collapse state を所有し、
// brand + nav + user-menu を desktop aside と mobile drawer の両方へ同じツリーで配る。
import type { ReactNode } from "react";
import Link from "next/link";

import { SidebarBrand } from "./SidebarBrand";
import { SidebarCollapseToggle } from "./SidebarCollapseToggle";
import { SidebarDrawer } from "./SidebarDrawer";
import { SidebarNav } from "./SidebarNav";
import { SidebarShellProvider } from "./SidebarShellContext";
import { SidebarUserMenu } from "./SidebarUserMenu";
import { ShellIcon } from "./icons";
import type { ShellNavGroup, ShellRole } from "./shell-config";
import { useSidebarState } from "./useSidebarState";

// admin-sidebar-public-return-link (#1021) を統一 shell へ継承。
// 旧 AdminSidebar の「公開サイトに戻る」導線を admin role 限定で再実装する。
// public/member route は viewer/member role で本リンクを描画せず、auth-slot-coverage の
// 「public guest route に data-role="public-return" が存在しない」契約を満たす。
function AdminPublicReturn({ collapsed }: { readonly collapsed: boolean }) {
  return (
    <Link
      href="/"
      data-role="public-return"
      data-component="admin-sidebar-public-return"
      aria-label="公開サイトに戻る"
      title={collapsed ? "公開サイトに戻る" : undefined}
      className="flex items-center gap-3 rounded-sm px-3 py-2 text-sm text-[var(--ubm-color-text-secondary)] hover:bg-[var(--shell-active-bg)] hover:text-[var(--ubm-color-text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ubm-color-accent)]"
    >
      <span
        aria-hidden="true"
        className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center text-[var(--ubm-color-text-secondary)]"
      >
        <ShellIcon id="home" />
      </span>
      <span className={collapsed ? "sr-only" : "flex-1"}>公開サイトに戻る</span>
    </Link>
  );
}

export interface SidebarShellProps {
  readonly role: ShellRole;
  readonly user: { readonly displayName: string; readonly email: string; readonly initials: string } | null;
  readonly navGroups: ReadonlyArray<ShellNavGroup>;
  readonly activePath: string;
  /** Task E が埋める mobile trigger。drawer/collapse setter は context 経由。 */
  readonly mobileTriggerSlot: ReactNode;
  /** main の data-route 値。呼出側 route group（"member" / "public" 等）を渡す。既定は "shell"。 */
  readonly routeKey?: string;
  /** main の data-section-rhythm 値。未指定なら属性を出力しない。 */
  readonly sectionRhythm?: string;
  readonly children: ReactNode;
}

export function SidebarShell({
  role,
  user,
  navGroups,
  activePath,
  mobileTriggerSlot,
  routeKey = "shell",
  sectionRhythm,
  children,
}: SidebarShellProps) {
  const { mode, drawerOpen, toggleCollapsed, setDrawerOpen } = useSidebarState();
  const collapsed = mode === "collapsed";

  const sidebarContent = (sidebarCollapsed: boolean) => (
    <>
      <SidebarBrand collapsed={sidebarCollapsed} />
      <SidebarNav navGroups={navGroups} collapsed={sidebarCollapsed} activePath={activePath} />
      {role === "admin" ? <AdminPublicReturn collapsed={sidebarCollapsed} /> : null}
      <SidebarUserMenu role={role} user={user} collapsed={sidebarCollapsed} />
    </>
  );

  return (
    <SidebarShellProvider value={{ mode, drawerOpen, toggleCollapsed, setDrawerOpen }}>
      <div
        data-shell-root="true"
        data-shell-collapsed={collapsed ? "true" : "false"}
        // auth-slot 観測契約: viewer→guest / member / admin（旧ヘッダーの data-auth-state を shell へ継承）。
        data-auth-state={role === "viewer" ? "guest" : role}
        className="flex min-h-screen w-full bg-[var(--ubm-color-surface-bg)] text-[var(--ubm-color-text-primary)]"
      >
        <aside
          data-shell="sidebar"
          data-collapsed={collapsed ? "true" : "false"}
          className="hidden w-[var(--shell-bar-w)] shrink-0 flex-col gap-3 border-r border-[var(--shell-bar-border)] bg-[var(--shell-bar-bg)] p-3 data-[collapsed=true]:w-[var(--shell-bar-w-collapsed)] md:flex"
        >
          {sidebarContent(collapsed)}
          <div className="mt-auto flex justify-end pt-2">
            <SidebarCollapseToggle />
          </div>
        </aside>

        <SidebarDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
          {sidebarContent(false)}
        </SidebarDrawer>

        <div className="flex min-w-0 flex-1 flex-col">
          <div
            data-shell="mobile-bar"
            className="flex items-center gap-2 border-b border-[var(--shell-bar-border)] bg-[var(--shell-bar-bg)] px-3 py-2 md:hidden"
          >
            {mobileTriggerSlot}
            <span className="text-sm font-semibold text-[var(--ubm-color-text-primary)]">
              UBM兵庫
            </span>
          </div>
          <main
            data-shell="main"
            data-route={routeKey}
            {...(sectionRhythm ? { "data-section-rhythm": sectionRhythm } : {})}
            className="min-w-0 flex-1"
          >
            {children}
          </main>
        </div>
      </div>
    </SidebarShellProvider>
  );
}
