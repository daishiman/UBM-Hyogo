// task-15: recentActions の DataTable（JST 表示）
import type { AdminDashboardView } from "@ubm-hyogo/shared";
import Link from "next/link";
import { formatJstDateTime } from "../../../../lib/format/datetime";

export interface RecentActionsTableProps {
  readonly items: AdminDashboardView["recentActions"];
}

export function RecentActionsTable({ items }: RecentActionsTableProps) {
  return (
    <section className="ui-card rounded-[var(--ubm-radius-lg)] border border-[var(--ubm-color-border-default)] bg-[var(--ubm-color-surface-panel)] p-4">
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--ubm-color-text-primary)]">直近のアクション (7日)</h2>
        <Link
          href="/admin/audit"
          className="text-xs text-[var(--ubm-color-accent)] hover:underline"
        >
          監査ログを開く →
        </Link>
      </header>
      {items.length === 0 ? (
        <p role="status" className="mt-3 text-sm text-[var(--ubm-color-text-muted)]">
          直近 7 日のアクションはありません
        </p>
      ) : (
        <table className="mt-3 w-full text-left text-sm">
          <caption className="sr-only">直近 7 日に発生した管理操作</caption>
          <thead>
            <tr className="border-b border-[var(--ubm-color-border-default)] text-xs uppercase tracking-wide text-[var(--ubm-color-text-muted)]">
              <th scope="col" className="py-2 pr-3">日時 (JST)</th>
              <th scope="col" className="py-2 pr-3">実行者</th>
              <th scope="col" className="py-2 pr-3">アクション</th>
              <th scope="col" className="py-2">対象</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr
                key={row.auditId}
                className="border-b border-[var(--ubm-color-border-default)] last:border-b-0"
              >
                <td className="py-2 pr-3 text-[var(--ubm-color-text-secondary)]">
                  {formatJstDateTime(row.createdAt)}
                </td>
                <td className="py-2 pr-3 text-[var(--ubm-color-text-secondary)]">
                  {row.actorEmail ?? "—"}
                </td>
                <td className="py-2 pr-3 font-medium text-[var(--ubm-color-text-primary)]">
                  {row.action}
                </td>
                <td className="py-2 text-[var(--ubm-color-text-secondary)]">
                  {row.targetType}
                  {row.targetId ? `:${row.targetId}` : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
