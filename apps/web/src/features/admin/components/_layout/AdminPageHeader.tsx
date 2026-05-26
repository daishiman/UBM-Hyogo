// task-15: admin 共通 page header（breadcrumb + title + action slot）
import type { ReactNode } from "react";
import { Breadcrumb } from "../../../../components/admin/Breadcrumb";

export interface AdminPageHeaderProps {
  readonly title: string;
  readonly eyebrow?: string;
  readonly description?: string;
  readonly breadcrumbs?: ReadonlyArray<{ label: string; href?: string }>;
  readonly actions?: ReactNode;
  readonly headingId?: string;
}

export function AdminPageHeader({
  title,
  eyebrow,
  description,
  breadcrumbs,
  actions,
  headingId,
}: AdminPageHeaderProps) {
  return (
    <header className="flex flex-col gap-2 border-b border-[var(--ubm-color-border-default)] pb-4">
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <Breadcrumb items={breadcrumbs} className="text-sm text-[var(--ubm-color-text-muted)]" />
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          {eyebrow ? (
            <p className="text-[10px] font-semibold uppercase text-[var(--ubm-color-text-muted)] [letter-spacing:var(--ubm-eyebrow-tracking,0.12em)]">
              {eyebrow}
            </p>
          ) : null}
          <h1
            id={headingId}
            className="text-2xl font-semibold text-[var(--ubm-color-text-primary)]"
          >
            {title}
          </h1>
          {description ? (
            <p className="text-sm text-[var(--ubm-color-text-secondary)]">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
