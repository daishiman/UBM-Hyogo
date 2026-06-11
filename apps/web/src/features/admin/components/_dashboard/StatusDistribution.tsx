import type { StatusSlice } from "../../../../lib/admin/admin-dashboard-ui";
import { MEMBER_STATUS_LABELS } from "../../../../lib/admin/dashboardGlossary";

type Status = StatusSlice["status"];

const COLOR_VAR: Record<Status, string> = {
  public: "var(--ubm-color-ok)",
  member_only: "var(--ubm-color-info)",
  hidden: "var(--ubm-color-warn)",
};

// ドットの色はトークン参照の className で表現する（inline style は禁止・ZoneDistribution と同型）。
const DOT_CLASS: Record<Status, string> = {
  public: "bg-[var(--ubm-color-ok)]",
  member_only: "bg-[var(--ubm-color-info)]",
  hidden: "bg-[var(--ubm-color-warn)]",
};

const STATUS_ORDER: ReadonlyArray<Status> = ["public", "member_only", "hidden"];

interface BarLayout {
  readonly status: Status;
  readonly count: number;
  readonly label: string;
  readonly colorVar: string;
}

export interface StatusDistributionProps {
  readonly slices: ReadonlyArray<StatusSlice> | undefined;
}

function computeBarLayout(slices: ReadonlyArray<StatusSlice>): ReadonlyArray<BarLayout> {
  const ordered = STATUS_ORDER.flatMap((status) => {
    const slice = slices.find((item) => item.status === status);
    return slice ? [{ ...slice, count: Math.max(0, slice.count) }] : [];
  });
  return ordered.map((slice) => ({
    status: slice.status,
    count: slice.count,
    label: MEMBER_STATUS_LABELS[slice.status],
    colorVar: COLOR_VAR[slice.status],
  }));
}

function buildAriaLabel(slices: ReadonlyArray<StatusSlice>): string {
  const items = computeBarLayout(slices).map((bar) => `${bar.label} ${bar.count}`);
  return `公開ステータス分布: ${items.join(", ")}`;
}

export function StatusDistribution({ slices }: StatusDistributionProps) {
  const bars = slices ? computeBarLayout(slices) : [];

  if (!slices || bars.length === 0) {
    return (
      <section className="ui-card rounded-[var(--ubm-radius-lg)] border border-[var(--ubm-color-border-default)] bg-[var(--ubm-color-surface-panel)] p-4">
        <h2 className="text-sm font-semibold text-[var(--ubm-color-text-primary)]">公開ステータス</h2>
        <p role="status" className="mt-2 text-sm text-[var(--ubm-color-text-muted)]">
          分布データは現在集計対象外です
        </p>
      </section>
    );
  }
  const ariaLabel = buildAriaLabel(slices);
  const maxCount = Math.max(1, ...bars.map((bar) => bar.count));
  const total = bars.reduce((sum, bar) => sum + bar.count, 0);

  return (
    <section className="ui-card rounded-[var(--ubm-radius-lg)] border border-[var(--ubm-color-border-default)] bg-[var(--ubm-color-surface-panel)] p-4">
      <h2 className="text-sm font-semibold text-[var(--ubm-color-text-primary)]">公開ステータス</h2>
      <ul className="mt-3 space-y-3" role="img" aria-label={ariaLabel} data-testid="status-distribution-list">
        {bars.map((bar) => {
          const widthPct = total > 0 ? Math.min(100, (bar.count / maxCount) * 100) : 0;
          return (
            <li key={bar.status} data-testid="status-bar" data-status={bar.status}>
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 text-xs text-[var(--ubm-color-text-primary)]">
                  <span
                    aria-hidden="true"
                    className={`inline-block h-2 w-2 rounded-full ${DOT_CLASS[bar.status]}`}
                  />
                  {bar.label}
                </span>
                <span className="tabular-nums text-xs text-[var(--ubm-color-text-primary)]">
                  {bar.count}名
                </span>
              </div>
              <svg
                className="mt-1 h-2 w-full overflow-hidden rounded fill-[var(--ubm-color-bg)]"
                viewBox="0 0 100 8"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <title>{`${bar.label}: ${bar.count}`}</title>
                <rect width="100" height="8" rx="4" />
                <rect width={widthPct} height="8" rx="4" fill={bar.colorVar} />
              </svg>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
