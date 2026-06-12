import type { AttendanceZoneDistribution } from "@ubm-hyogo/shared";
import { ZONE_HELP, ZONE_LABEL, formatRate } from "../lib/format-attendance";

interface Props {
  readonly data: AttendanceZoneDistribution;
}

export function AttendanceZoneDistributionChart({ data }: Props) {
  if (data.rows.length === 0) {
    return (
      <div className="attendance-zone-empty" data-testid="attendance-zone-empty">
        出席回数べつのデータがありません
      </div>
    );
  }
  return (
    <div
      className="attendance-zone-distribution"
      role="group"
      aria-label="出席回数べつの人数"
      data-testid="attendance-zone-distribution"
    >
      <p className="attendance-zone-legend">{ZONE_HELP}</p>
      <ul>
        {data.rows.map((row) => (
          <li key={row.zone} className="attendance-zone-row">
            <span className="attendance-zone-label">{ZONE_LABEL[row.zone]}</span>
            <svg
              className="attendance-zone-bar"
              viewBox="0 0 100 8"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <rect width="100" height="8" rx="4" fill="var(--ubm-color-border-default)" />
              <rect
                width={Math.max(0, row.rate * 100)}
                height="8"
                rx="4"
                fill="var(--ubm-color-accent)"
              />
            </svg>
            <span className="attendance-zone-count">
              {row.attendeeCount} 人 ({formatRate(row.rate)})
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
