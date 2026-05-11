// task-15: Status 分布チップ群
import type { StatusSlice } from "../../../../lib/admin/admin-dashboard-ui";

const LABEL: Record<StatusSlice["status"], string> = {
  public: "公開",
  member_only: "会員限定",
  hidden: "非公開",
};

const TONE: Record<StatusSlice["status"], string> = {
  public: "bg-[var(--ubm-color-ok-soft)] text-[var(--ubm-color-ok)]",
  member_only: "bg-[var(--ubm-color-info-soft)] text-[var(--ubm-color-info)]",
  hidden: "bg-[var(--ubm-color-warn-soft)] text-[var(--ubm-color-warn)]",
};

export interface StatusDistributionProps {
  readonly slices: ReadonlyArray<StatusSlice> | undefined;
}

export function StatusDistribution({ slices }: StatusDistributionProps) {
  if (!slices || slices.length === 0) {
    return (
      <section className="ui-card rounded-[var(--ubm-radius-lg)] border border-[var(--ubm-color-border-default)] bg-[var(--ubm-color-surface-panel)] p-4">
        <h2 className="text-sm font-semibold text-[var(--ubm-color-text-primary)]">公開ステータス</h2>
        <p role="status" className="mt-2 text-sm text-[var(--ubm-color-text-muted)]">
          分布データは現在集計対象外です
        </p>
      </section>
    );
  }
  return (
    <section className="ui-card rounded-[var(--ubm-radius-lg)] border border-[var(--ubm-color-border-default)] bg-[var(--ubm-color-surface-panel)] p-4">
      <h2 className="text-sm font-semibold text-[var(--ubm-color-text-primary)]">公開ステータス</h2>
      <ul className="mt-3 flex flex-wrap gap-2">
        {slices.map((s) => (
          <li
            key={s.status}
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${TONE[s.status]}`}
          >
            <span>{LABEL[s.status]}</span>
            <span className="tabular-nums">{s.count}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
