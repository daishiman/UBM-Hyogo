// task-15: admin 共通 page header（breadcrumb + title + action slot）
import type { ReactNode } from "react";

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
        <nav aria-label="パンくず">
          <ol className="flex flex-wrap gap-1 text-sm text-[var(--ubm-color-text-muted)]">
            {breadcrumbs.map((b, i) => (
              <li key={`${b.label}-${i}`} className="after:px-1 after:content-['/'] last:after:content-none">
                {b.href ? (
                  <a href={b.href} className="hover:underline">
                    {b.label}
                  </a>
                ) : (
                  <span>{b.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
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
