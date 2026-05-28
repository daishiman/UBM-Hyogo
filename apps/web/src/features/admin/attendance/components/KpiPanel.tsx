import type { AttendanceOverviewExt } from "@ubm-hyogo/shared";
import { formatRate, formatDelta } from "../lib/format-attendance";

interface Props {
  readonly overview: AttendanceOverviewExt;
  readonly attendeeCount: number;
}

function Card({ label, value, hint, testId }: { label: string; value: string; hint?: string; testId: string }) {
  return (
    <article className="attendance-kpi-card" data-testid={testId}>
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
      className="attendance-kpi-grid"
      aria-label="出席KPI"
      data-testid="attendance-kpi-panel"
    >
      <Card
        label="全体出席率"
        value={formatRate(overview.overallRate)}
        hint={`前期間比 ${formatDelta(overview.overallRate, overview.previousPeriodRate)}`}
        testId="attendance-kpi-rate"
      />
      <Card
        label="期間内出席者数"
        value={String(attendeeCount)}
        hint="期間内 unique 出席者"
        testId="attendance-kpi-attendees"
      />
      <Card
        label="平均出席数"
        value={avgPerSession}
        hint="セッション平均"
        testId="attendance-kpi-avg"
      />
      <Card
        label="セッション数"
        value={String(overview.totalSessions)}
        hint="期間内開催"
        testId="attendance-kpi-sessions"
      />
    </section>
  );
}
