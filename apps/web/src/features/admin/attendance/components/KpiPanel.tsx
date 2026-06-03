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
        hint={`全出席枠に対する延べ出席率 / 前期間比 ${formatDelta(overview.overallRate, overview.previousPeriodRate)}`}
        testId="attendance-kpi-rate"
      />
      <Card
        label="期間内延べ出席数"
        value={String(attendeeCount)}
        hint="セッション別出席者数の合計"
        testId="attendance-kpi-attendees"
      />
      <Card
        label="平均出席数"
        value={avgPerSession}
        hint="1 セッションあたりの延べ出席数"
        testId="attendance-kpi-avg"
      />
      <Card
        label="セッション数"
        value={String(overview.totalSessions)}
        hint="期間内の開催セッション数"
        testId="attendance-kpi-sessions"
      />
    </section>
  );
}
