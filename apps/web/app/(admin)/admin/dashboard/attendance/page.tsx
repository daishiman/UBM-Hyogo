// ut-02a-followup-002: /admin/dashboard/attendance
// 3 ブロック: overview カード / by-session テーブル / ranking テーブル
// 不変条件 #5: D1 直接アクセス禁止 — fetchAdmin 経由で内部 API を呼ぶ
import { fetchAdmin } from "../../../../../src/lib/admin/server-fetch";

export const dynamic = "force-dynamic";

interface AttendanceOverview {
  totalSessions: number;
  totalMembers: number;
  overallRate: number;
}

interface SessionAttendanceRow {
  sessionId: string;
  title: string;
  heldOn: string;
  attendeeCount: number;
  rate: number;
}

interface MemberAttendanceRanking {
  memberId: string;
  displayName: string;
  attendedCount: number;
  rate: number;
}

const fmtPct = (rate: number): string => `${(rate * 100).toFixed(1)}%`;

export default async function AdminAttendanceDashboardPage() {
  const [overview, bySession, ranking] = await Promise.all([
    fetchAdmin<AttendanceOverview>("/admin/dashboard/attendance/overview"),
    fetchAdmin<SessionAttendanceRow[]>(
      "/admin/dashboard/attendance/by-session?limit=20",
    ),
    fetchAdmin<MemberAttendanceRanking[]>(
      "/admin/dashboard/attendance/ranking?limit=20",
    ),
  ]);

  return (
    <section aria-labelledby="admin-attendance-dashboard-h">
      <h1 id="admin-attendance-dashboard-h">出席ダッシュボード</h1>

      <div
        className="kpi-grid"
        role="group"
        aria-label="出席サマリー"
        data-testid="attendance-overview"
      >
        <KpiCard label="総セッション数" value={String(overview.totalSessions)} />
        <KpiCard label="対象会員数" value={String(overview.totalMembers)} />
        <KpiCard label="全体出席率" value={fmtPct(overview.overallRate)} />
      </div>

      <h2>セッション別出席状況</h2>
      {bySession.length === 0 ? (
        <p data-testid="attendance-by-session-empty">データがありません</p>
      ) : (
        <table data-testid="attendance-by-session-table">
          <thead>
            <tr>
              <th>開催日</th>
              <th>タイトル</th>
              <th>出席者数</th>
              <th>出席率</th>
            </tr>
          </thead>
          <tbody>
            {bySession.map((s) => (
              <tr key={s.sessionId}>
                <td>{s.heldOn}</td>
                <td>{s.title}</td>
                <td>{s.attendeeCount}</td>
                <td>{fmtPct(s.rate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>会員別出席ランキング</h2>
      {ranking.length === 0 ? (
        <p data-testid="attendance-ranking-empty">データがありません</p>
      ) : (
        <table data-testid="attendance-ranking-table">
          <thead>
            <tr>
              <th>会員</th>
              <th>出席数</th>
              <th>出席率</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((m) => (
              <tr key={m.memberId}>
                <td>{m.displayName || m.memberId}</td>
                <td>{m.attendedCount}</td>
                <td>{fmtPct(m.rate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function KpiCard({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <article className="kpi-card" data-testid="attendance-kpi-card">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
    </article>
  );
}
