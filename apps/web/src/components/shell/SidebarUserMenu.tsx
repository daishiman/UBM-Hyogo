"use client";

// Task B — sidebar 左下の user menu。`<details>` ベースの popover で role 別 action を集約。
// ログアウトは既存 SignOutButton を embed し挙動を変えない。route 変化で自動 close。
import { useEffect, useId, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { SignOutButton } from "../auth/SignOutButton";
import { browserDocument } from "../../lib/is-browser";
import { SidebarUserAvatar } from "./SidebarUserAvatar";
import type { ShellRole } from "./shell-config";
import { buildUserMenuActions, roleDisplayLabel } from "./user-menu-config";

export interface SidebarUserMenuProps {
  readonly role: ShellRole;
  readonly user: { readonly displayName: string; readonly email: string; readonly initials: string } | null;
  readonly collapsed: boolean;
}

export function SidebarUserMenu({ role, user, collapsed }: SidebarUserMenuProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();
  const actions = buildUserMenuActions(role);
  const roleLabel = roleDisplayLabel(role);
  const displayName = user?.displayName || user?.email || "ゲスト";
  const isViewer = role === "viewer";
  const tooltipId = `shell-user-menu-tooltip-${useId().replace(/:/g, "")}`;

  // route 変化で popover を自動 close。
  useEffect(() => {
    if (detailsRef.current) detailsRef.current.open = false;
  }, [pathname]);

  useEffect(() => {
    const doc = browserDocument();
    if (!doc) return;

    const closeIfOutside = (event: PointerEvent) => {
      const details = detailsRef.current;
      if (!details?.open) return;
      const target = event.target;
      if (target instanceof Node && details.contains(target)) return;
      details.open = false;
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      const details = detailsRef.current;
      if (!details?.open || event.key !== "Escape") return;
      details.open = false;
    };

    doc.addEventListener("pointerdown", closeIfOutside);
    doc.addEventListener("keydown", closeOnEscape);
    return () => {
      doc.removeEventListener("pointerdown", closeIfOutside);
      doc.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <details
      ref={detailsRef}
      data-shell-block="user-menu"
      className="group relative border-t border-[var(--shell-bar-border)] pt-2"
    >
      <summary
        role="button"
        aria-haspopup="menu"
        aria-label="ユーザーメニュー"
        aria-describedby={collapsed ? tooltipId : undefined}
        data-shell-tooltip-host={collapsed ? "true" : undefined}
        className={`relative flex cursor-pointer list-none items-center rounded-sm px-3 py-2 hover:bg-[var(--shell-active-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ubm-color-accent)] ${collapsed ? "justify-center gap-0" : "gap-2"}`}
      >
        <SidebarUserAvatar initials={user?.initials ?? ""} role={role} size="md" />
        <span className={collapsed ? "sr-only" : "flex min-w-0 flex-col leading-tight"}>
          <span className="truncate text-sm font-medium text-[var(--ubm-color-text-primary)]">
            {displayName}
          </span>
          {roleLabel ? (
            <span className="truncate text-xs text-[var(--ubm-color-text-secondary)]">
              {roleLabel}
            </span>
          ) : null}
        </span>
        {isViewer && collapsed ? (
          <span className="sr-only">ログイン</span>
        ) : null}
        {collapsed ? (
          <span id={tooltipId} role="tooltip" className="ubm-shell-tooltip">
            ユーザーメニュー
          </span>
        ) : null}
      </summary>
      <div
        role="menu"
        data-shell-block="user-menu-popover"
        className="absolute bottom-full left-0 z-20 mb-2 flex w-56 flex-col gap-1 rounded-md border border-[var(--ubm-color-border-default)] bg-[var(--ubm-color-surface-panel)] p-2 shadow-lg"
      >
        {actions.map((action) => {
          if (action.kind === "signout") {
            return (
              <SignOutButton key={action.id} className="ui-button-block" />
            );
          }
          return (
            <Link
              key={action.id}
              role="menuitem"
              href={action.href}
              data-action={action.id}
              data-shell-block={action.kind === "login" ? "login-cta" : undefined}
              className={
                action.kind === "login"
                  ? "rounded-sm border border-[var(--ubm-color-accent)] bg-[var(--ubm-color-accent)] px-3 py-2 text-sm font-semibold text-[var(--ubm-color-accent-ink)] hover:bg-[var(--shell-active-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ubm-color-accent)]"
                  : "rounded-sm px-3 py-2 text-sm text-[var(--ubm-color-text-primary)] hover:bg-[var(--shell-active-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ubm-color-accent)]"
              }
            >
              {action.label}
            </Link>
          );
        })}
      </div>
    </details>
  );
}
