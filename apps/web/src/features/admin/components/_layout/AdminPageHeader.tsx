// task-15: admin 共通 page header（breadcrumb + title + action slot）
import type { ReactNode } from "react";
import { Breadcrumb } from "../../../../components/admin/Breadcrumb";

export interface AdminPageHeaderProps {
  readonly title: string;
  readonly description?: string;
  readonly breadcrumbs?: ReadonlyArray<{ label: string; href?: string }>;
  readonly actions?: ReactNode;
}

export function AdminPageHeader({ title, description, breadcrumbs, actions }: AdminPageHeaderProps) {
  return (
    <header className="flex flex-col gap-2 border-b border-[var(--ubm-color-border-default)] pb-4">
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <Breadcrumb items={breadcrumbs} className="text-sm text-[var(--ubm-color-text-muted)]" />
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--ubm-color-text-primary)]">{title}</h1>
          {description ? (
            <p className="text-sm text-[var(--ubm-color-text-secondary)]">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
