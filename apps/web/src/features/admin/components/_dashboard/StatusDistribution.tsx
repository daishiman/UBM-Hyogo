import type { StatusSlice } from "../../../../lib/admin/admin-dashboard-ui";

type Status = StatusSlice["status"];

const VIEWBOX = {
  width: 600,
  height: 200,
  top: 20,
  right: 20,
  bottom: 32,
  left: 20,
  gap: 24,
} as const;

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

const COLOR_VAR: Record<Status, string> = {
  public: "var(--ubm-color-ok)",
  member_only: "var(--ubm-color-info)",
  hidden: "var(--ubm-color-warn)",
};

const STATUS_ORDER: ReadonlyArray<Status> = ["public", "member_only", "hidden"];

interface BarLayout {
  readonly status: Status;
  readonly count: number;
  readonly label: string;
  readonly colorVar: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface StatusDistributionProps {
  readonly slices: ReadonlyArray<StatusSlice> | undefined;
}

function computeBarLayout(slices: ReadonlyArray<StatusSlice>): ReadonlyArray<BarLayout> {
  const ordered = STATUS_ORDER.flatMap((status) => {
    const slice = slices.find((item) => item.status === status);
    return slice ? [{ ...slice, count: Math.max(0, slice.count) }] : [];
  });
  const chartWidth = VIEWBOX.width - VIEWBOX.left - VIEWBOX.right;
  const chartHeight = VIEWBOX.height - VIEWBOX.top - VIEWBOX.bottom;
  const barWidth =
    ordered.length > 0 ? (chartWidth - VIEWBOX.gap * Math.max(ordered.length - 1, 0)) / ordered.length : 0;
  const maxCount = Math.max(1, ...ordered.map((slice) => slice.count));

  return ordered.map((slice, index) => {
    const height = (slice.count / maxCount) * chartHeight;
    return {
      status: slice.status,
      count: slice.count,
      label: LABEL[slice.status],
      colorVar: COLOR_VAR[slice.status],
      x: VIEWBOX.left + index * (barWidth + VIEWBOX.gap),
      y: VIEWBOX.top + (chartHeight - height),
      width: barWidth,
      height,
    };
  });
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

  return (
    <section className="ui-card rounded-[var(--ubm-radius-lg)] border border-[var(--ubm-color-border-default)] bg-[var(--ubm-color-surface-panel)] p-4">
      <h2 className="text-sm font-semibold text-[var(--ubm-color-text-primary)]">公開ステータス</h2>
      <svg
        role="img"
        aria-label={ariaLabel}
        viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
        preserveAspectRatio="xMidYMid meet"
        className="mt-3 h-auto w-full max-w-[600px]"
        data-testid="status-distribution-chart"
      >
        {bars.map((bar) => (
          <g key={bar.status} data-testid="status-bar" data-status={bar.status}>
            <rect
              x={bar.x}
              y={bar.y}
              width={bar.width}
              height={bar.height}
              fill={bar.colorVar}
              rx="4"
            >
              <title>{`${bar.label}: ${bar.count}`}</title>
            </rect>
            <text
              x={bar.x + bar.width / 2}
              y={Math.max(12, bar.y - 6)}
              textAnchor="middle"
              className="fill-[var(--ubm-color-text-primary)] text-xs tabular-nums"
            >
              {bar.count}
            </text>
            <text
              x={bar.x + bar.width / 2}
              y={VIEWBOX.height - 8}
              textAnchor="middle"
              className="fill-[var(--ubm-color-text-muted)] text-xs"
            >
              {bar.label}
            </text>
          </g>
        ))}
      </svg>
      <ul className="mt-3 flex flex-wrap gap-2">
        {bars.map((s) => (
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
