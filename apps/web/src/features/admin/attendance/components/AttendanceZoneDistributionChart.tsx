import type { AttendanceZoneDistribution } from "@ubm-hyogo/shared";
import { ZONE_LABEL, formatRate } from "../lib/format-attendance";

interface Props {
  readonly data: AttendanceZoneDistribution;
}

export function AttendanceZoneDistributionChart({ data }: Props) {
  if (data.rows.length === 0) {
    return (
      <div className="attendance-zone-empty" data-testid="attendance-zone-empty">
        区画別分布データがありません
      </div>
    );
  }
  return (
    <div
      className="attendance-zone-distribution"
      role="group"
      aria-label="区画別出席分布"
      data-testid="attendance-zone-distribution"
    >
      <ul>
        {data.rows.map((row) => (
          <li key={row.zone} className="attendance-zone-row">
            <span className="attendance-zone-label">{ZONE_LABEL[row.zone]}</span>
            <span
              className="attendance-zone-bar"
              style={{ width: `${Math.max(2, row.rate * 100)}%` }}
              aria-hidden="true"
            />
            <span className="attendance-zone-count">
              {row.attendeeCount} 人 ({formatRate(row.rate)})
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
