// task-15: KPI セル 1 枚。tone は OKLch tokens 経由のみ。
import { cn } from "../../../../lib/cn";

export type KpiTone = "neutral" | "success" | "warning" | "danger";

export interface KpiCardProps {
  readonly label: string;
  readonly value: number;
  readonly tone?: KpiTone;
  readonly hint?: string;
  readonly testId?: string;
}

const TONE_CLASS: Record<KpiTone, string> = {
  neutral: "text-[var(--ubm-color-text-primary)]",
  success: "text-[var(--ubm-color-ok)]",
  warning: "text-[var(--ubm-color-warn)]",
  danger: "text-[var(--ubm-color-danger)]",
};

export function KpiCard({ label, value, tone = "neutral", hint, testId }: KpiCardProps) {
  return (
    <article
      className="ui-card flex flex-col gap-1 rounded-[var(--ubm-radius-lg)] border border-[var(--ubm-color-border-default)] bg-[var(--ubm-color-surface-panel)] p-4"
      data-testid={testId}
    >
      <span className="text-xs uppercase tracking-wide text-[var(--ubm-color-text-muted)]">{label}</span>
      <strong className={cn("text-3xl font-semibold tabular-nums", TONE_CLASS[tone])}>
        {value.toLocaleString("ja-JP")}
      </strong>
      {hint ? <span className="text-xs text-[var(--ubm-color-text-secondary)]">{hint}</span> : null}
    </article>
  );
}
