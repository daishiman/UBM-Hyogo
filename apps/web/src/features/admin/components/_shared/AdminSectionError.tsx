import { cn } from "../../../../lib/cn";

export interface AdminSectionErrorProps {
  sectionLabel: string;
  code?: string;
  correlationId?: string;
  message?: string;
  className?: string;
}

export function AdminSectionError({
  sectionLabel,
  code,
  correlationId,
  message,
  className,
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
    </div>
  );
}
