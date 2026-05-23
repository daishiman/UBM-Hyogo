import { cn } from "../../../../lib/cn";

export type AdminStatTone = "neutral" | "positive" | "warning" | "critical";

export interface AdminStatProps {
  label: string;
  value: string | number;
  hint?: string;
  tone?: AdminStatTone;
  loading?: boolean;
  className?: string;
}

export function AdminStat({
  label,
  value,
  hint,
  tone = "neutral",
  loading = false,
  className,
}: AdminStatProps) {
  return (
    <dl
      data-tone={tone}
      data-loading={loading || undefined}
      data-testid="admin-stat"
      className={cn("admin-stat", className)}
    >
      <dt className="admin-stat__label">{label}</dt>
      <dd className="admin-stat__value">
        {loading ? (
          <span aria-hidden="true" className="admin-stat__skeleton" />
        ) : (
          <span>{value}</span>
        )}
        {hint && !loading ? (
          <span className="admin-stat__hint">{hint}</span>
        ) : null}
      </dd>
    </dl>
  );
}
