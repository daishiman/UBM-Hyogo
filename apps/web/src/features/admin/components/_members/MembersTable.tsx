// task-15: 会員管理テーブル本体（sort / select / row action）
"use client";
import type { AdminMemberListView } from "@ubm-hyogo/shared";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { Pagination } from "../../../../components/ui/Pagination";

type Member = AdminMemberListView["members"][number];

export interface MembersTableProps {
  readonly items: ReadonlyArray<Member>;
  readonly selected: ReadonlySet<string>;
  readonly onToggleSelect: (memberId: string) => void;
  readonly onToggleSelectAll: () => void;
  readonly onOpenRow: (memberId: string) => void;
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly onPageChange: (page: number) => void;
}

const STATE_LABEL: Record<string, string> = {
  public: "公開",
  member_only: "会員限定",
  hidden: "非公開",
  private: "非公開",
};

function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!user || !domain) return email;
  if (user.length <= 1) return `${user}***@${domain}`;
  return `${user[0]}***@${domain}`;
}

export function MembersTable({
  items,
  selected,
  onToggleSelect,
  onToggleSelectAll,
  onOpenRow,
  page,
  pageSize,
  total,
  onPageChange,
}: MembersTableProps) {
  if (items.length === 0) {
    return (
      <EmptyState title="該当する会員はいません" />
    );
  }

  const allSelected = items.every((m) => selected.has(m.memberId));
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="ui-card overflow-hidden rounded-[var(--ubm-radius-md)] border border-[var(--ubm-color-border-default)] bg-[var(--ubm-color-surface-panel)]">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">会員一覧</caption>
        <thead>
          <tr className="border-b border-[var(--ubm-color-border-default)] bg-[var(--ubm-color-surface-panel-2)] text-xs uppercase tracking-wide text-[var(--ubm-color-text-muted)]">
            <th scope="col" className="px-3 py-2">
              <input
                type="checkbox"
                aria-label="全選択"
                checked={allSelected}
                onChange={onToggleSelectAll}
              />
            </th>
            <th scope="col" className="px-3 py-2">氏名</th>
            <th scope="col" className="px-3 py-2">メール</th>
            <th scope="col" className="px-3 py-2">公開</th>
            <th scope="col" className="px-3 py-2">同意</th>
            <th scope="col" className="px-3 py-2">最終回答</th>
          </tr>
        </thead>
        <tbody>
          {items.map((m) => (
            <tr
              key={m.memberId}
              className="border-b border-[var(--ubm-color-border-default)] last:border-b-0 hover:bg-[var(--ubm-color-surface-panel-2)]"
              data-testid={`admin-members-row-${m.memberId}`}
            >
              <td className="px-3 py-2">
                <input
                  type="checkbox"
                  aria-label={`${m.fullName} を選択`}
                  checked={selected.has(m.memberId)}
                  onChange={() => onToggleSelect(m.memberId)}
                />
              </td>
              <td className="px-3 py-2">
                <button
                  type="button"
                  className="text-left font-medium text-[var(--ubm-color-accent)] hover:underline"
                  onClick={() => onOpenRow(m.memberId)}
                >
                  {m.fullName}
                </button>
              </td>
              <td className="px-3 py-2 text-[var(--ubm-color-text-secondary)]">
                {maskEmail(m.responseEmail)}
              </td>
              <td className="px-3 py-2 text-[var(--ubm-color-text-secondary)]">
                {STATE_LABEL[m.publishState] ?? m.publishState}
                {m.isDeleted ? "（削除済み）" : ""}
              </td>
              <td className="px-3 py-2 text-xs text-[var(--ubm-color-text-muted)]">
                公開:{m.publicConsent} / 規約:{m.rulesConsent}
              </td>
              <td className="px-3 py-2 text-xs text-[var(--ubm-color-text-muted)]">
                {m.lastSubmittedAt}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <nav
        aria-label="ページネーション"
        className="flex items-center justify-between border-t border-[var(--ubm-color-border-default)] px-3 py-2 text-xs text-[var(--ubm-color-text-secondary)]"
      >
        <span>
          {total} 件中 {Math.min(total, (page - 1) * pageSize + 1)}–{Math.min(total, page * pageSize)} 件目
        </span>
        <Pagination
          current={page}
          total={total}
          pageSize={pageSize}
          hasPrev={page > 1}
          hasNext={page < totalPages}
          onPrev={() => onPageChange(page - 1)}
          onNext={() => onPageChange(page + 1)}
          prevAriaLabel="前へ"
          nextAriaLabel="次へ"
        />
      </nav>
    </div>
  );
}
