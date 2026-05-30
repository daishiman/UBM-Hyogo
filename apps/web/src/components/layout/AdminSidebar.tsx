"use client";

import type { ReactNode } from "react";
import { SignOutButton } from "../auth/SignOutButton";
import { Avatar } from "../ui/Avatar";
import { AdminBrandBlock } from "./AdminBrandBlock";
import { AdminSidebarNavItem, type AdminSidebarBadgeTone } from "./AdminSidebarNavItem";

export interface AdminSidebarProps {
  readonly schemaDiffCount: number;
  readonly userDisplayName: string;
  readonly userEmail: string;
}

interface NavItemDef {
  readonly href: string;
  readonly label: string;
  readonly icon: ReactNode;
  readonly dataRole?: string;
  readonly badgeKey?: "schemaDiff";
}

interface NavGroupDef {
  readonly label: string;
  readonly items: ReadonlyArray<NavItemDef>;
}

function I({ d }: { readonly d: string }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

const ICON_HOME = <I d="M3 11l9-8 9 8M5 9v11h14V9" />;
const ICON_USERS = <I d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M17 3.13a4 4 0 0 1 0 7.75" />;
const ICON_USER_PLUS = <I d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM20 8v6M23 11h-6" />;
const ICON_USER = <I d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />;
const ICON_DASHBOARD = <I d="M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z" />;
const ICON_BAR_CHART = <I d="M3 21V10M9 21V4M15 21v-7M21 21V8" />;
const ICON_TAGS = <I d="M20.59 13.41 12 22l-9-9V3h10z M7 7h.01" />;
const ICON_DATABASE = <I d="M4 6c0-1.66 3.58-3 8-3s8 1.34 8 3-3.58 3-8 3-8-1.34-8-3zM4 6v6c0 1.66 3.58 3 8 3s8-1.34 8-3V6M4 12v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" />;
const ICON_CALENDAR = <I d="M3 7h18v14H3zM3 7l2-4h14l2 4M8 3v4M16 3v4" />;
const ICON_INBOX = <I d="M3 13h5l2 3h4l2-3h5M3 13V5h18v8M3 13v6h18v-6" />;
const ICON_GIT_MERGE = <I d="M18 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM6 9v6M6 15c0-6 12-3 12-9" />;
const ICON_AUDIT = <I d="M4 4h12l4 4v12H4zM8 4v4h4M8 12h8M8 16h8" />;

const GROUPS: ReadonlyArray<NavGroupDef> = [
  {
    label: "Public",
    items: [
      { href: "/members", label: "会員ディレクトリ", icon: ICON_USERS },
      { href: "/register", label: "登録", icon: ICON_USER_PLUS },
    ],
  },
  {
    label: "Members",
    items: [{ href: "/profile", label: "マイページ", icon: ICON_USER }],
  },
  {
    label: "Admin",
    items: [
      { href: "/admin", label: "ダッシュボード", icon: ICON_DASHBOARD },
      { href: "/admin/dashboard/attendance", label: "出席分析", icon: ICON_BAR_CHART },
      { href: "/admin/members", label: "会員管理", icon: ICON_USERS },
      { href: "/admin/tags", label: "タグキュー", icon: ICON_TAGS },
      { href: "/admin/schema", label: "スキーマ", icon: ICON_DATABASE, badgeKey: "schemaDiff" },
      { href: "/admin/meetings", label: "開催日", icon: ICON_CALENDAR },
      { href: "/admin/requests", label: "依頼キュー", icon: ICON_INBOX },
      { href: "/admin/identity-conflicts", label: "Identity重複", icon: ICON_GIT_MERGE },
      { href: "/admin/audit", label: "監査ログ", icon: ICON_AUDIT },
    ],
  },
];

function resolveBadge(
  item: NavItemDef,
  schemaDiffCount: number,
): { readonly tone: AdminSidebarBadgeTone; readonly count: number } | null {
  if (item.badgeKey === "schemaDiff") {
    return { tone: "warn", count: schemaDiffCount };
  }
  return null;
}

export function AdminSidebar({ schemaDiffCount, userDisplayName, userEmail }: AdminSidebarProps) {
  const displayName = userDisplayName || userEmail || "管理者";
  return (
    <nav
      aria-label="管理メニュー"
      className="admin-sidebar flex h-full flex-col gap-4 p-3"
      data-shell-block="sidebar-nav"
    >
      <AdminBrandBlock />
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
        {GROUPS.map((group) => (
          <section key={group.label} data-component="admin-nav-section" className="flex flex-col gap-1">
            <div
              data-component="admin-nav-label"
              className="px-3 text-xs font-semibold uppercase tracking-wide text-[var(--ubm-color-text-secondary)]"
            >
              {group.label}
            </div>
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <AdminSidebarNavItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  badge={resolveBadge(item, schemaDiffCount)}
                  {...(item.dataRole ? { dataRole: item.dataRole } : {})}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>
      <a
        href="/"
        data-role="public-return"
        data-component="admin-sidebar-public-return"
        aria-label="公開サイトに戻る"
        className="mx-1 mt-2 flex items-center gap-2 rounded px-3 py-2 text-sm text-[var(--ubm-color-text-secondary)] transition-colors hover:bg-[var(--ubm-color-surface-hover)] hover:text-[var(--ubm-color-text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ubm-color-accent)]"
      >
        <span aria-hidden="true">{ICON_HOME}</span>
        <span>公開サイトに戻る</span>
      </a>
      <footer
        data-component="admin-sidebar-footer"
        className="flex flex-col gap-2 border-t border-[var(--ubm-color-border-default)] pt-3"
      >
        <div data-component="user-chip" className="flex items-center gap-2 px-3">
          <Avatar size="sm" name={displayName} />
          <div data-component="user-chip-body" className="flex min-w-0 flex-col leading-tight">
            <span
              data-component="user-chip-name"
              className="truncate text-sm font-medium text-[var(--ubm-color-text-primary)]"
            >
              {displayName}
            </span>
            <span
              data-component="user-chip-email"
              className="truncate text-xs text-[var(--ubm-color-text-secondary)]"
            >
              {userEmail}
            </span>
          </div>
        </div>
        <SignOutButton />
      </footer>
    </nav>
  );
}
