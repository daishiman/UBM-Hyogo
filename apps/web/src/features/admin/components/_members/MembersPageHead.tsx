// followup-001 T-5.5: /admin/members 用 page-head（プロトタイプ準拠）。
// eyebrow `ADMIN / MEMBERS` + h-page + muted + btn-row 右寄せ。
// MVP 範囲外 action は `disabled + title="MVP 範囲外"` で表示のみ。
import { Button } from "../../../../components/ui/Button";

export interface MembersPageHeadProps {
  readonly total: number;
}

export function MembersPageHead({ total }: MembersPageHeadProps) {
  return (
    <header className="flex flex-col gap-2 border-b border-[var(--ubm-color-border-default)] pb-4">
      <div
        className="text-xs font-semibold uppercase tracking-wider text-[var(--ubm-color-text-muted)]"
        data-component="eyebrow"
      >
        ADMIN / MEMBERS
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1
            className="text-2xl font-semibold text-[var(--ubm-color-text-primary)]"
            data-component="h-page"
          >
            メンバー管理
          </h1>
          <p className="text-sm text-[var(--ubm-color-text-secondary)]">
            回答データ・公開フラグ・タグ付けをここから操作します。（{total} 件）
          </p>
        </div>
        <div className="flex items-center gap-2" data-component="btn-row">
          <Button variant="ghost" disabled title="MVP 範囲外" aria-disabled="true">
            CSV エクスポート
          </Button>
          <Button variant="primary" disabled title="MVP 範囲外" aria-disabled="true">
            Forms から取り込み
          </Button>
        </div>
      </div>
    </header>
  );
}
