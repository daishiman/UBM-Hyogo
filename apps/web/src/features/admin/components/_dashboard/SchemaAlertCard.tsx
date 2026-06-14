// task-15: unresolvedSchema > 0 のとき出るアラートカード
import Link from "next/link";

export interface SchemaAlertCardProps {
  readonly count: number;
}

export function SchemaAlertCard({ count }: SchemaAlertCardProps) {
  if (count <= 0) return null;
  return (
    <div
      role="alert"
      className="schema-alert-card flex flex-wrap items-center justify-between gap-3 rounded-[var(--ubm-radius-md)] border border-[var(--ubm-color-warn)] p-4"
    >
      <div>
        <strong className="block text-sm font-semibold text-[var(--ubm-color-warn)]">
          未対応のフォーム項目: {count} 件
        </strong>
        <p className="text-xs text-[var(--ubm-color-text-secondary)]">
          対応づけが必要なフォーム項目があります。
        </p>
      </div>
      <Link
        href="/admin/schema"
        className="text-sm font-medium text-[var(--ubm-color-warn)] hover:underline"
      >
        フォーム項目の対応づけを開く →
      </Link>
    </div>
  );
}
