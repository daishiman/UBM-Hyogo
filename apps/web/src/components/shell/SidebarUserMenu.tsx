"use client";

// unified-sidebar-shell-public-and-admin Task B: 左下ロール対応 user menu。
// popover は新規 primitive を生やさず <details> ベース（CSS-only fallback）。
// route 変更で自動 close。ログアウトは既存 SignOutButton を embed（signOut({ redirectTo: '/login' }) 不変）。
import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "../auth/SignOutButton";
import { SidebarUserAvatar } from "./SidebarUserAvatar";
import { buildUserMenuActions } from "./user-menu-config";
import type { ShellRole } from "./shell-config";

const ROLE_LABEL: Record<ShellRole, string | null> = {
  viewer: null,
  member: "会員",
  admin: "管理者",
};

export type SidebarUserMenuProps = {
  readonly role: ShellRole;
  readonly user: { readonly displayName: string; readonly email: string; readonly initials: string } | null;
  readonly collapsed: boolean;
};

export function SidebarUserMenu({ role, user, collapsed }: SidebarUserMenuProps) {
  const ref = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();
  const actions = buildUserMenuActions(role);
  const roleLabel = ROLE_LABEL[role];
  const displayName = user?.displayName || user?.email || "ゲスト";
  const initials = user?.initials ?? "";

  // route 変更時に popover を自動 close。
  useEffect(() => {
    if (ref.current) ref.current.open = false;
  }, [pathname]);

  return (
    <details
      ref={ref}
      data-component="shell-user-menu"
      data-role={role}
      className="group relative border-t border-[var(--ubm-color-border-default)] pt-2"
    >
      <summary
        role="button"
        aria-haspopup="menu"
        data-component="shell-user-trigger"
        className="flex cursor-pointer list-none items-center gap-2 rounded-sm px-2 py-2 hover:bg-[var(--ubm-color-surface-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ubm-color-accent)]"
      >
        <SidebarUserAvatar initials={initials} role={role} size="sm" />
        <span className={collapsed ? "sr-only" : "flex min-w-0 flex-col leading-tight"}>
          <span
            data-component="shell-user-name"
            className="truncate text-sm font-medium text-[var(--ubm-color-text-primary)]"
          >
            {displayName}
          </span>
          {roleLabel ? (
            <span
              data-component="shell-user-role"
              className="truncate text-xs text-[var(--ubm-color-text-secondary)]"
            >
              {roleLabel}
            </span>
          ) : null}
        </span>
      </summary>
      <div
        role="menu"
        data-component="shell-user-popover"
        className="absolute bottom-full left-0 z-10 mb-1 flex w-56 flex-col gap-1 rounded-md border border-[var(--ubm-color-border-default)] bg-[var(--ubm-color-surface-panel)] p-2 shadow-lg"
      >
        {actions.map((action) =>
          action.kind === "signout" ? (
            <SignOutButton key={action.id} className="w-full justify-start" label={action.label} />
          ) : (
            <Link
              key={action.id}
              role="menuitem"
              href={action.href}
              data-component="shell-user-action"
              data-action={action.id}
              className="rounded-sm px-3 py-2 text-sm text-[var(--ubm-color-text-primary)] hover:bg-[var(--ubm-color-surface-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ubm-color-accent)]"
            >
              {action.label}
            </Link>
          ),
        )}
      </div>
    </details>
  );
}
