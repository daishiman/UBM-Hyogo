import type { ReactNode } from "react";

export type AdminTopbarProps = {
  readonly breadcrumb?: ReactNode;
  readonly actions?: ReactNode;
};

export function AdminTopbar({ breadcrumb, actions }: AdminTopbarProps = {}) {
  const hasActions = actions != null;

  return (
    <header
      className="flex items-center justify-between border-b border-[var(--ubm-color-border-default)] px-4 py-3"
      data-shell="topbar"
    >
      <div
        className="text-sm font-semibold text-[var(--ubm-color-text-primary)]"
        data-component="admin-breadcrumb-slot"
      >
        {breadcrumb ?? "管理"}
      </div>
      <div
        aria-hidden={hasActions ? undefined : "true"}
        data-component="admin-topbar-actions"
      >
        {actions}
      </div>
    </header>
  );
}
