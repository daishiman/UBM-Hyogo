import type { ReactNode } from "react";
import { cn } from "../../../../lib/cn";

export type AdminEmptyStateIcon = "inbox" | "search" | "tag" | "calendar" | "shield";

export interface AdminEmptyStateProps {
  title: string;
  description?: string;
  primaryAction?: ReactNode;
  icon?: AdminEmptyStateIcon;
  className?: string;
}

const ICON_PATHS: Record<AdminEmptyStateIcon, ReactNode> = {
  inbox: (
    <path d="M3 13l3-7h12l3 7v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6Zm0 0h5l1 2h6l1-2h5" />
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  tag: <path d="M3 3h8l10 10-8 8L3 11V3Zm4 4h.01" />,
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  shield: <path d="M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6l-8-3Z" />,
};

export function AdminEmptyState({
  title,
  description,
  primaryAction,
  icon = "inbox",
  className,
}: AdminEmptyStateProps) {
  return (
    <div
      role="status"
      data-testid="admin-empty-state"
      className={cn("admin-empty-state", className)}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="admin-empty-state__icon"
      >
        {ICON_PATHS[icon]}
      </svg>
      <p className="admin-empty-state__title">{title}</p>
      {description ? (
        <p className="admin-empty-state__description">{description}</p>
      ) : null}
      {primaryAction ? (
        <div className="admin-empty-state__action">{primaryAction}</div>
      ) : null}
    </div>
  );
}
