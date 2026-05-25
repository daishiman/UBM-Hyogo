import { cn } from "../../../../lib/cn";

export interface AdminSectionErrorProps {
  sectionLabel: string;
  code?: string;
  correlationId?: string;
  message?: string;
  className?: string;
  onRetry?: () => void;
  retryLabel?: string;
  isRetrying?: boolean;
}

export function AdminSectionError({
  sectionLabel,
  code,
  correlationId,
  message,
  className,
  onRetry,
  retryLabel = "再読み込み",
  isRetrying = false,
}: AdminSectionErrorProps) {
  return (
    <div
      role="alert"
      aria-live="polite"
      data-testid="admin-section-error"
      className={cn("admin-section-error", className)}
    >
      <p className="admin-section-error__title">
        {sectionLabel} の読み込みに失敗しました
      </p>
      <p className="admin-section-error__message">
        {message ?? "再読み込みしてください。"}
      </p>
      <dl className="admin-section-error__meta">
        {code ? (
          <>
            <dt>code</dt>
            <dd>
              <code>{code}</code>
            </dd>
          </>
        ) : null}
        {correlationId ? (
          <>
            <dt>correlation</dt>
            <dd>
              <code>{correlationId}</code>
            </dd>
          </>
        ) : null}
      </dl>
      {onRetry ? (
        <button
          type="button"
          data-testid="admin-section-error-retry"
          className="admin-section-error__retry"
          aria-label={`${sectionLabel} を再読み込み`}
          aria-busy={isRetrying ? "true" : "false"}
          disabled={isRetrying}
          onClick={() => {
            if (isRetrying) return;
            onRetry();
          }}
        >
          {isRetrying ? `${retryLabel}中…` : retryLabel}
        </button>
      ) : null}
    </div>
  );
}
