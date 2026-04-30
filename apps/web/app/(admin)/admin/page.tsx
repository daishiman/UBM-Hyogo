// 06c: /admin ダッシュボード
// AC-8: GET /admin/dashboard 1 fetch 集約
import type { AdminDashboardView } from "@ubm-hyogo/shared";
import { fetchAdmin } from "../../../src/lib/admin/server-fetch";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const view = await fetchAdmin<AdminDashboardView>("/admin/dashboard");
  const t = view.totals;
  return (
    <section aria-labelledby="admin-dashboard-h">
      <h1 id="admin-dashboard-h">ダッシュボード</h1>

      <div className="kpi-grid" role="group" aria-label="主要指標">
        <KpiCard label="総会員" value={t.members} />
        <KpiCard label="同意保留" value={t.pendingConsent} />
        <KpiCard label="削除済み" value={t.deletedMembers} />
        <KpiCard label="未タグ件数" value={t.queuedTagAssignments} />
      </div>

      <p>
        schema 状態: <strong data-testid="schema-state">{view.schemaState}</strong>
      </p>

      <h2>最近の提出</h2>
      <table>
        <thead>
          <tr>
            <th>提出日時</th>
            <th>氏名</th>
            <th>memberId</th>
          </tr>
        </thead>
        <tbody>
          {view.recentSubmissions.map((r) => (
            <tr key={r.responseId}>
              <td>{r.submittedAt}</td>
              <td>{r.fullName}</td>
              <td>{r.memberId ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="meta">生成日時: {view.generatedAt}</p>
    </section>
  );
}

function KpiCard({ label, value }: { readonly label: string; readonly value: number }) {
  return (
    <article className="kpi-card">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
    </article>
  );
}
