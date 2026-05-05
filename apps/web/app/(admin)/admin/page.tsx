// 06c-A: /admin ダッシュボード
// AC: GET /admin/dashboard 1 fetch 集約 (KPI 4 + recentActions)
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
        <KpiCard label="総会員数" value={t.totalMembers} />
        <KpiCard label="公開中" value={t.publicMembers} />
        <KpiCard label="未タグ" value={t.untaggedMembers} />
        <KpiCard label="スキーマ未解決" value={t.unresolvedSchema} />
      </div>

      <h2>直近のアクション（7日）</h2>
      <table>
        <thead>
          <tr>
            <th>日時</th>
            <th>実行者</th>
            <th>アクション</th>
            <th>対象</th>
          </tr>
        </thead>
        <tbody>
          {view.recentActions.map((r) => (
            <tr key={r.auditId}>
              <td>{r.createdAt}</td>
              <td>{r.actorEmail ?? "—"}</td>
              <td>{r.action}</td>
              <td>
                {r.targetType}
                {r.targetId ? `:${r.targetId}` : ""}
              </td>
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
    <article className="kpi-card" data-testid="admin-dashboard-card">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
    </article>
  );
}
