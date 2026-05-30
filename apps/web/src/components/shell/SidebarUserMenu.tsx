"use client";

// unified-sidebar-shell / Task B: 左下ユーザーメニュー。
// - viewer: 「ログイン」リンクを直接表示（popover なし）。
// - member/admin: <details> popover に role 別 action を集約。route 変化で自動 close。
import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "../auth/SignOutButton";
import { ChevronUpDownIcon } from "./icons";
import { SidebarUserAvatar } from "./SidebarUserAvatar";
import type { ShellRole } from "./shell-config";
import { buildUserMenuActions, roleDisplayLabel } from "./user-menu-config";

export type SidebarUserMenuProps = {
  role: ShellRole;
  user: { displayName: string; email: string; initials: string } | null;
  collapsed: boolean;
};

const MENU_ITEM_CLASS =
  "flex items-center rounded-md px-3 py-2 text-sm text-[var(--ubm-color-text-primary)] hover:bg-[var(--ubm-color-surface-bg-2)]";

export function SidebarUserMenu({ role, user, collapsed }: SidebarUserMenuProps) {
  const pathname = usePathname();
  const detailsRef = useRef<HTMLDetailsElement>(null);

  // route 変化で popover を閉じる。
  useEffect(() => {
    if (detailsRef.current) detailsRef.current.open = false;
  }, [pathname]);

  const actions = buildUserMenuActions(role);

  // viewer: popover なしの直接ログインリンク。
  if (role === "viewer" || !user) {
    return (
      <div
        data-testid="shell-user-menu"
        data-shell-block="user-menu"
        data-role="viewer"
        className="border-t border-[var(--shell-bar-border)] p-2"
      >
        <Link href="/login" data-shell-block="user-action" data-action-id="login" className={MENU_ITEM_CLASS}>
          <span className={collapsed ? "sr-only" : ""}>ログイン</span>
          <span aria-hidden="true" className={collapsed ? "" : "sr-only"}>
            →
          </span>
        </Link>
      </div>
    );
  }

  const roleLabel = roleDisplayLabel(role);

  return (
    <details
      ref={detailsRef}
      data-testid="shell-user-menu"
      data-shell-block="user-menu"
      data-role={role}
      className="group border-t border-[var(--shell-bar-border)] p-2"
    >
      <summary
        role="button"
        aria-haspopup="menu"
        className="flex cursor-pointer list-none items-center gap-2 rounded-md px-2 py-1.5 hover:bg-[var(--ubm-color-surface-bg-2)] [&::-webkit-details-marker]:hidden"
      >
        <SidebarUserAvatar initials={user.initials} role={role} size="sm" />
        <span className={collapsed ? "sr-only" : "flex min-w-0 flex-1 flex-col leading-tight"}>
          <span className="truncate text-sm font-medium text-[var(--ubm-color-text-primary)]">
            {user.displayName}
          </span>
          {roleLabel ? (
            <span className="truncate text-xs text-[var(--ubm-color-text-muted)]">{roleLabel}</span>
          ) : null}
        </span>
        <span aria-hidden="true" className={collapsed ? "sr-only" : "shrink-0 text-[var(--ubm-color-text-muted)]"}>
          <ChevronUpDownIcon />
        </span>
      </summary>
      <div
        role="menu"
        data-shell-block="user-menu-popover"
        className="mt-1 flex flex-col gap-0.5"
      >
        {actions.map((action) => {
          if (action.kind === "signout") {
            return (
              <SignOutButton
                key={action.id}
                className={`${MENU_ITEM_CLASS} w-full justify-start`}
                label={action.label}
              />
            );
          }
          return (
            <Link
              key={action.id}
              href={action.href}
              role="menuitem"
              data-shell-block="user-action"
              data-action-id={action.id}
              className={MENU_ITEM_CLASS}
            >
              {action.label}
            </Link>
          );
        })}
      </div>
    </details>
  );
}
