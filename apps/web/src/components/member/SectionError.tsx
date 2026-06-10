import { cn } from "../../lib/cn";

export interface SectionErrorProps {
  title?: string;
  detail?: string;
  retryHref?: string;
  actionHref?: string;
  actionLabel?: string;
  dataCause?: string;
  className?: string;
}

export function SectionError({
  title = "読み込みに失敗しました",
  detail = "時間をおいて再読み込みしてください。",
  retryHref,
  actionHref,
  actionLabel,
  dataCause,
  className,
}: SectionErrorProps) {
  return (
    <div
      role="alert"
      aria-live="polite"
      data-component="section-error"
      data-variant="member"
      data-cause={dataCause}
      className={cn("section-error section-error--member", className)}
    >
      <p data-role="title">{title}</p>
      <p data-role="detail">{detail}</p>
      {actionHref && actionLabel ? (
        <a href={actionHref} data-role="action">
          {actionLabel}
        </a>
      ) : null}
      {retryHref ? (
        <a href={retryHref} data-role="retry">
          再読み込み
        </a>
      ) : null}
    </div>
  );
}
