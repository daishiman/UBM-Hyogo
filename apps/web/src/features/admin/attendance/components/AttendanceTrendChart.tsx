import type { AttendanceTrend } from "@ubm-hyogo/shared";

interface Props {
  readonly trend: AttendanceTrend;
}

export function AttendanceTrendChart({ trend }: Props) {
  const buckets = trend.buckets;
  if (buckets.length === 0) {
    return (
      <div className="attendance-trend-empty" data-testid="attendance-trend-empty">
        トレンドデータがありません
      </div>
    );
  }
  const max = Math.max(1, ...buckets.map((b) => b.attendeeCount));
  const w = 600;
  const h = 160;
  const stepX = w / Math.max(1, buckets.length - 1);
  const pts = buckets
    .map((b, i) => {
      const x = i * stepX;
      const y = h - (b.attendeeCount / max) * (h - 16) - 8;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <figure
      className="attendance-trend-chart"
      aria-label="出席トレンド"
      data-testid="attendance-trend-chart"
    >
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label="月別出席者数">
        <polyline
          fill="none"
          stroke="var(--ubm-color-accent, currentColor)"
          strokeWidth="2"
          points={pts}
        />
        {buckets.map((b, i) => {
          const x = i * stepX;
          const y = h - (b.attendeeCount / max) * (h - 16) - 8;
          return (
            <g key={b.period}>
              <circle cx={x} cy={y} r={3} fill="var(--ubm-color-accent, currentColor)" />
              <title>{`${b.period}: ${b.attendeeCount} 人 / ${b.sessionCount} セッション`}</title>
            </g>
          );
        })}
      </svg>
      <figcaption>
        {buckets[0].period} 〜 {buckets[buckets.length - 1].period} の出席推移
      </figcaption>
    </figure>
  );
}
