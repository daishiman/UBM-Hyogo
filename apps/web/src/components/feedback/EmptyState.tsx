import type { ReactNode } from "react";

export interface EmptyStateProps {
  title: string;
  description?: string;
  variant?: "default" | "compact";
  /** 「絞り込みをクリア」など、クリア後に遷移すべき URL */
  resetHref?: string;
  resetLabel?: string;
  children?: ReactNode;
}

/**
 * 共通空状態 component.
 * Server Component で利用可能。AC-13 / Phase 6 F-13 の挙動を満たす。
 */
export function EmptyState({
  title,
  description,
  variant = "default",
  resetHref,
  resetLabel = "絞り込みをクリア",
  children,
}: EmptyStateProps) {
  return (
    <div role="status" data-component="empty-state" data-variant={variant}>
      <div data-role="icon" aria-hidden="true" />
      <p data-role="title">{title}</p>
      {description ? (
        <p data-role="description">{description}</p>
      ) : null}
      {resetHref ? (
        <a href={resetHref} data-role="reset">
          {resetLabel}
        </a>
      ) : null}
      {children}
    </div>
  );
}
