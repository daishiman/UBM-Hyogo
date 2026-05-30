"use client";

import type { ReactElement } from "react";
import type { ShellRole } from "./shell-config";

export type SidebarUserAvatarProps = {
  readonly initials: string;
  readonly role: ShellRole;
  readonly size?: "sm" | "md";
};

export function SidebarUserAvatar({
  initials,
  role,
  size = "md",
}: SidebarUserAvatarProps): ReactElement {
  const isAdmin = role === "admin";
  return (
    <span
      className="ui-sidebar-user-avatar"
      data-role={isAdmin ? "admin" : undefined}
      data-size={size}
    >
      <span aria-hidden="true">{initials}</span>
      {isAdmin ? <span data-admin-badge className="ui-sidebar-user-avatar-badge" /> : null}
    </span>
  );
}
