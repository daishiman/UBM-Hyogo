import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";

export interface BannerProps extends HTMLAttributes<HTMLDivElement> {
  tone?: "info" | "success" | "warning" | "danger";
  icon?: ReactNode;
  title?: string;
  action?: ReactNode;
  children: ReactNode;
}

export function Banner({ tone = "info", icon, title, action, children, className, ...props }: BannerProps) {
  const role = tone === "warning" || tone === "danger" ? "alert" : "status";
  return (
    <div {...props} className={cn("ui-banner", className)} role={role} data-tone={tone}>
      {icon ? <span aria-hidden="true">{icon}</span> : null}
      <div>
        {title ? <strong>{title}</strong> : null}
        {children}
      </div>
      {action}
    </div>
  );
}
