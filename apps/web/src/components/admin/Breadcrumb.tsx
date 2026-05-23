import { Fragment } from "react";
import { cn } from "../../lib/cn";

export interface BreadcrumbItem {
  readonly label: string;
  readonly href?: string;
}

export interface BreadcrumbProps {
  readonly items: ReadonlyArray<BreadcrumbItem>;
  readonly separator?: string;
  readonly className?: string;
}

export function Breadcrumb({ items, separator = "/", className }: BreadcrumbProps) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="breadcrumb" data-component="breadcrumb" className={cn("ui-breadcrumb", className)}>
      <ol className="ui-breadcrumb__list">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <Fragment key={`${item.label}-${idx}`}>
              <li className="ui-breadcrumb__item">
                {isLast || !item.href ? (
                  <span aria-current={isLast ? "page" : undefined}>{item.label}</span>
                ) : (
                  <a href={item.href}>{item.label}</a>
                )}
              </li>
              {!isLast ? (
                <li aria-hidden="true" className="ui-breadcrumb__sep">
                  {separator}
                </li>
              ) : null}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
