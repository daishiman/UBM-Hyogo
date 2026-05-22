import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: "default" | "accent" | "success" | "warning" | "danger" | "info";
  outline?: boolean;
  dot?: boolean;
  children: ReactNode;
}

export function badgeVariants({
  tone = "default",
  outline = false,
  className,
}: Pick<BadgeProps, "tone" | "outline" | "className"> = {}) {
  return cn("ui-badge", `ui-badge-${tone}`, outline && "ui-badge-outline", className);
}

export function Badge({ tone = "default", outline = false, dot, children, className, ...props }: BadgeProps) {
  return (
    <span {...props} className={badgeVariants({ tone, outline, className })} data-tone={tone}>
      {dot ? <span aria-hidden="true" className="ui-badge-dot" /> : null}
      {children}
    </span>
  );
}
