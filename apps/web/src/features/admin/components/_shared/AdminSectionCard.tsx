import type { ElementType, ReactNode } from "react";
import { useId } from "react";
import { cn } from "../../../../lib/cn";

export type AdminSectionCardDensity = "default" | "compact";

export interface AdminSectionCardProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  id?: string;
  density?: AdminSectionCardDensity;
  as?: ElementType;
  className?: string;
}

export function AdminSectionCard({
  title,
  description,
  actions,
  children,
  id,
  density = "default",
  as,
  className,
}: AdminSectionCardProps) {
  const As = (as ?? "section") as ElementType;
  const headingId = useId();
  return (
    <As
      id={id}
      aria-labelledby={headingId}
      data-density={density}
      className={cn(
        "ui-card admin-section-card",
        density === "compact" && "admin-section-card--compact",
        className,
      )}
    >
      <header className="admin-section-card__header">
        <div className="admin-section-card__heading">
          <h2 id={headingId} className="admin-section-card__title">
            {title}
          </h2>
          {description ? (
            <p className="admin-section-card__description">{description}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="admin-section-card__actions">{actions}</div>
        ) : null}
      </header>
      <div className="admin-section-card__body">{children}</div>
    </As>
  );
}
