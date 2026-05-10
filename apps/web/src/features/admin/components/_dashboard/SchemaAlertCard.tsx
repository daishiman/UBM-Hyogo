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
      className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--ubm-radius-md)] border border-[var(--ubm-color-warn)] p-4"
      style={{ background: "color-mix(in oklch, var(--ubm-color-warn) 8%, transparent)" }}
    >
      <div>
        <strong className="block text-sm font-semibold text-[var(--ubm-color-warn)]">
          スキーマ未解決: {count} 件
        </strong>
        <p className="text-xs text-[var(--ubm-color-text-secondary)]">
          alias の確定が必要なフォーム項目があります。
        </p>
      </div>
      <Link
        href="/admin/schema"
        className="text-sm font-medium text-[var(--ubm-color-warn)] hover:underline"
      >
        schema 管理を開く →
      </Link>
    </div>
  );
}
