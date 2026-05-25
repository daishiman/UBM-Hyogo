import { cn } from "../../lib/cn";

export interface SectionErrorProps {
  title?: string;
  detail?: string;
  retryHref?: string;
  className?: string;
}

export function SectionError({
  title = "読み込みに失敗しました",
  detail = "時間をおいて再読み込みしてください。",
  retryHref,
  className,
}: SectionErrorProps) {
  return (
    <div
      role="alert"
      aria-live="polite"
      data-component="section-error"
      data-variant="public"
      className={cn("section-error section-error--public", className)}
    >
      <p data-role="title">{title}</p>
      <p data-role="detail">{detail}</p>
      {retryHref ? (
        <a href={retryHref} data-role="retry">
          再読み込み
        </a>
      ) : null}
    </div>
  );
}
