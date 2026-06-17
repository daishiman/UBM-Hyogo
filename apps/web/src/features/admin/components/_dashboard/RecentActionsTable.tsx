// task-15: recentActions のアクティビティリスト（JST 表示・日本語化）
import type { AdminDashboardView } from "@ubm-hyogo/shared";
import Link from "next/link";
import { describeAuditAction, describeTarget } from "../../../../lib/admin/dashboardGlossary";
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
        <ul className="mt-3 flex flex-col gap-2" data-testid="recent-actions-list">
          {items.map((row) => (
            <li
              key={row.auditId}
              data-testid="recent-action-item"
              className="rounded-[var(--ubm-radius-md)] border border-[var(--ubm-color-border-default)] bg-[var(--ubm-color-bg)] p-3"
            >
              <p className="text-sm font-medium text-[var(--ubm-color-text-primary)]">
                {describeAuditAction(row.action)}
              </p>
              <p className="mt-1 text-xs text-[var(--ubm-color-text-secondary)]">
                {row.actorEmail ?? "—"}
                <span aria-hidden="true"> · </span>
                {formatJstDateTime(row.createdAt)}
              </p>
              <p className="mt-0.5 truncate text-xs text-[var(--ubm-color-text-muted)]">
                対象: {describeTarget(row.targetType, row.targetId)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
