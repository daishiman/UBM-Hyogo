"use client";

// unified-sidebar-shell / Task B: initials アバター。admin のみ右下 badge dot。
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
  return (
    <span
      data-shell-block="user-avatar"
      data-role={role === "admin" ? "admin" : undefined}
      className="relative inline-flex shrink-0"
    >
      <span
        aria-hidden="true"
        className={[
          "inline-flex items-center justify-center rounded-full bg-[var(--ubm-color-accent-soft)] font-semibold uppercase text-[var(--ubm-color-accent-ink)]",
          size === "sm" ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm",
        ].join(" ")}
      >
        {initials || "?"}
      </span>
      {role === "admin" ? (
        <span
          data-shell-block="admin-badge"
          aria-hidden="true"
          className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-[var(--ubm-color-surface-panel)] bg-[var(--ubm-color-accent)]"
        />
      ) : null}
    </span>
  );
}
