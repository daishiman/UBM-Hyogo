import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  icon?: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action, className, children, ...props }: EmptyStateProps) {
  return (
    <div {...props} className={cn("ui-empty-state", className)} role="status">
      {icon ? <span aria-hidden="true">{icon}</span> : null}
      {title ? <h2>{title}</h2> : null}
      {description ? <p>{description}</p> : null}
      {children}
      {action}
    </div>
  );
}
