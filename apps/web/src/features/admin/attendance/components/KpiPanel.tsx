import type { AttendanceOverviewExt } from "@ubm-hyogo/shared";
import { formatRate, formatDelta } from "../lib/format-attendance";

interface Props {
  readonly overview: AttendanceOverviewExt;
  readonly attendeeCount: number;
}

function Metric({
  label,
  value,
  hint,
  testId,
}: {
  label: string;
  value: string;
  hint?: string;
  testId: string;
}) {
  return (
    <article className="attendance-kpi-card attendance-kpi-card--secondary" data-testid={testId}>
      <div className="attendance-kpi-label">{label}</div>
      <div className="attendance-kpi-value">{value}</div>
      {hint ? <div className="attendance-kpi-hint">{hint}</div> : null}
    </article>
  );
}

export function KpiPanel({ overview, attendeeCount }: Props) {
  const avgPerSession =
    overview.totalSessions > 0
      ? (attendeeCount / overview.totalSessions).toFixed(1)
      : "0";

  return (
    <section
      className="attendance-kpi-panel"
      aria-labelledby="attendance-primary-kpi-heading"
      data-testid="attendance-kpi-panel"
    >
      <article className="attendance-kpi-card attendance-kpi-card--primary" data-testid="attendance-kpi-rate">
        <div className="attendance-kpi-label" id="attendance-primary-kpi-heading">
          全体出席率
        </div>
        <div className="attendance-kpi-value attendance-kpi-value--hero">
          {formatRate(overview.overallRate)}
        </div>
        <div className="attendance-kpi-hint">
          前期間比 {formatDelta(overview.overallRate, overview.previousPeriodRate)}
        </div>
        <div className="attendance-kpi-support">
          <span>ユニーク出席率 {formatRate(overview.uniqueAttendanceRate)}</span>
          <span>{overview.uniqueAttendeeCount} / {overview.totalMembers} 名</span>
        </div>
      </article>
      <div className="attendance-kpi-secondary-grid" aria-label="出席KPI補助指標">
        <Metric
          label="期間内延べ出席数"
          value={String(attendeeCount)}
          hint="セッション別出席者数の合計"
          testId="attendance-kpi-attendees"
        />
        <Metric
          label="平均出席数"
          value={avgPerSession}
          hint="1 セッションあたり"
          testId="attendance-kpi-avg"
        />
        <Metric
          label="セッション数"
          value={String(overview.totalSessions)}
          hint="期間内の開催数"
          testId="attendance-kpi-sessions"
        />
      </div>
    </section>
  );
}
