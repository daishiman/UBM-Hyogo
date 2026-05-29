"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactElement, type ReactNode } from "react";
import { SignOutButton } from "../auth/SignOutButton";
import type { ShellRole } from "./shell-config";
import { SidebarUserAvatar } from "./SidebarUserAvatar";
import { buildUserMenuActions, type UserMenuAction } from "./user-menu-config";

export type SidebarUserMenuProps = {
  readonly role: ShellRole;
  readonly user: { displayName: string; email: string; initials: string } | null;
  readonly collapsed: boolean;
};

function roleLabel(role: ShellRole): string | null {
  if (role === "admin") return "管理者";
  if (role === "member") return "会員";
  return null;
}

function renderAction(action: UserMenuAction): ReactNode {
  if (action.kind === "signout") {
    return (
      <SignOutButton
        key={action.id}
        variant="menu-item"
        label={action.label}
      />
    );
  }
  return (
    <Link
      key={action.id}
      href={action.href}
      role="menuitem"
      data-action-id={action.id}
      className="ui-sidebar-user-menu-item"
    >
      {action.label}
    </Link>
  );
}

export function SidebarUserMenu({
  role,
  user,
  collapsed,
}: SidebarUserMenuProps): ReactElement {
  const ref = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (ref.current) {
      ref.current.open = false;
    }
  }, [pathname]);

  const actions = buildUserMenuActions(role);
  const initials = user ? user.initials : "?";
  const label = roleLabel(role);
  const displayName = user ? user.displayName : "ゲスト";

  return (
    <details
      ref={ref}
      data-shell-user-menu
      data-role={role}
      data-collapsed={collapsed ? "true" : "false"}
      className="ui-sidebar-user-menu"
    >
      <summary
        role="button"
        aria-haspopup="menu"
        aria-label="ユーザーメニュー"
        className="ui-sidebar-user-menu-summary"
      >
        <SidebarUserAvatar initials={initials} role={role} size={collapsed ? "sm" : "md"} />
        <span className={collapsed ? "sr-only" : "ui-sidebar-user-menu-name"}>
          {displayName}
          {label ? <small>{label}</small> : null}
        </span>
      </summary>
      <div role="menu" className="ui-sidebar-user-menu-popover">
        {actions.map((a) => renderAction(a))}
      </div>
    </details>
  );
}
