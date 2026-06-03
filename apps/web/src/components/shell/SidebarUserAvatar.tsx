"use client";

// Task B — sidebar 左下のユーザーアバター。admin のみ右下に admin badge dot を表示。
import type { ShellRole } from "./shell-config";

export interface SidebarUserAvatarProps {
  readonly initials: string;
  readonly role: ShellRole;
  readonly size?: "sm" | "md";
}

export function SidebarUserAvatar({ initials, role, size = "md" }: SidebarUserAvatarProps) {
  const dimension = size === "sm" ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm";
  const avatarText = initials || (role === "viewer" ? "G" : "?");
  return (
    <span
      data-shell-block="user-avatar"
      data-role={role === "admin" ? "admin" : undefined}
      className="relative inline-flex shrink-0"
    >
      <span
        aria-hidden="true"
        className={`inline-flex items-center justify-center rounded-full border border-[var(--ubm-color-border-default)] bg-[var(--ubm-color-accent-soft)] font-semibold text-[var(--ubm-color-accent-ink)] ${dimension}`}
      >
        {avatarText}
      </span>
      {role === "admin" ? (
        <span
          data-shell-block="user-avatar-admin-badge"
          aria-hidden="true"
          className="absolute -bottom-0.5 -right-0.5 inline-block h-2.5 w-2.5 rounded-full border border-[var(--ubm-color-surface-panel)] bg-[var(--ubm-color-accent)]"
        />
      ) : null}
    </span>
  );
}
