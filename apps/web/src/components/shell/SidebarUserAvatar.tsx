"use client";

// unified-sidebar-shell-public-and-admin Task B: initials アバター。admin のみ右下 badge dot。
import type { ShellRole } from "./shell-config";

export function SidebarUserAvatar({
  initials,
  role,
  size = "md",
}: {
  readonly initials: string;
  readonly role: ShellRole;
  readonly size?: "sm" | "md";
}) {
  const isAdmin = role === "admin";
  return (
    <span
      data-component="shell-user-avatar"
      data-role={isAdmin ? "admin" : undefined}
      data-size={size}
      className="relative inline-flex shrink-0 items-center justify-center rounded-full border border-[var(--ubm-color-border-default)] bg-[var(--ubm-color-surface-panel)] font-semibold text-[var(--ubm-color-text-primary)] data-[size=sm]:h-8 data-[size=sm]:w-8 data-[size=sm]:text-xs data-[size=md]:h-9 data-[size=md]:w-9 data-[size=md]:text-sm"
    >
      {initials || "?"}
      {isAdmin ? (
        <span
          data-component="shell-user-admin-badge"
          aria-hidden="true"
          className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-[var(--ubm-color-surface-panel)] bg-[var(--ubm-color-accent)]"
        />
      ) : null}
    </span>
  );
}
