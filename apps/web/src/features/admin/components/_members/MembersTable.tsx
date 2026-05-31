// followup-003 Lane C: プロトタイプ準拠テーブル (pages-admin.jsx L223-276)
"use client";
import type { AdminMemberListView } from "@ubm-hyogo/shared";
import { Chip } from "../../../../components/ui/Chip";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { Pagination } from "../../../../components/ui/Pagination";
import { statusTone, zoneTone } from "../../../../lib/tones";
import { MemberAvatar } from "./MemberAvatar";
import { MemberStateChipRow } from "./MemberStateChip";
import { MemberPublishSwitch } from "./MemberPublishSwitch";

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

function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!user || !domain) return email;
  if (user.length <= 1) return `${user}***@${domain}`;
  return `${user[0]}***@${domain}`;
}

function memberTagPills(tags: Member["tags"]) {
  if (!tags?.length) {
    return (
      <Chip tone="warning" dot>
        未タグ
      </Chip>
    );
  }

  const visibleTags = tags.slice(0, 2);
  const remaining = tags.length - visibleTags.length;

  return (
    <>
      {visibleTags.map((tag) => (
        <Chip key={tag.code} tone="neutral">
          {tag.label}
        </Chip>
      ))}
      {remaining > 0 ? (
        <span title={tags.map((tag) => tag.label).join(" / ")}>
          <Chip tone="stone">+{remaining}</Chip>
        </span>
      ) : null}
    </>
  );
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
    return <EmptyState title="該当する会員はいません" />;
  }

  const allSelected = items.every((m) => selected.has(m.memberId));
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="ui-card overflow-hidden rounded-[var(--ubm-radius-md)] border border-[var(--ubm-color-border-default)] bg-[var(--ubm-color-surface-panel)]">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">会員一覧</caption>
        <thead>
          <tr className="border-b border-[var(--ubm-color-border-default)] bg-[var(--ubm-color-surface-panel-2)] text-xs uppercase tracking-wide text-[var(--ubm-color-text-muted)]">
            <th scope="col" className="w-10 px-3 py-2">
              <input
                type="checkbox"
                aria-label="全選択"
                checked={allSelected}
                onChange={onToggleSelectAll}
              />
            </th>
            <th scope="col" className="px-3 py-2">メンバー</th>
            <th scope="col" className="px-3 py-2">メール</th>
            <th scope="col" className="px-3 py-2">区画 / ステータス</th>
            <th scope="col" className="px-3 py-2">タグ</th>
            <th scope="col" className="px-3 py-2">最終更新</th>
            <th scope="col" className="w-36 px-3 py-2">公開</th>
            <th scope="col" className="w-12 px-3 py-2 sr-only">操作</th>
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
                  onClick={(e) => e.stopPropagation()}
                />
              </td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <MemberAvatar memberId={m.memberId} fullName={m.fullName} size="sm" />
                  <div className="flex flex-col">
                    <button
                      type="button"
                      className="text-left font-semibold text-[var(--ubm-color-text-primary)] hover:text-[var(--ubm-color-accent)] hover:underline"
                      onClick={() => onOpenRow(m.memberId)}
                    >
                      {m.fullName}
                    </button>
                    {m.occupation ? (
                      <span className="text-xs text-[var(--ubm-color-text-muted)]">
                        {m.occupation}
                      </span>
                    ) : null}
                  </div>
                </div>
              </td>
              <td className="px-3 py-2 font-mono text-xs text-[var(--ubm-color-text-secondary)]">
                {maskEmail(m.responseEmail)}
              </td>
              <td className="px-3 py-2">
                <div className="flex flex-wrap gap-1.5">
                  {m.ubmZone ? (
                    <Chip tone={zoneTone(m.ubmZone)} dot>
                      {m.ubmZone}
                    </Chip>
                  ) : null}
                  {m.ubmMembershipType ? (
                    <Chip tone={statusTone(m.ubmMembershipType)}>
                      {m.ubmMembershipType}
                    </Chip>
                  ) : null}
                  <MemberStateChipRow
                    publishState={m.publishState}
                    isDeleted={m.isDeleted}
                  />
                </div>
              </td>
              <td className="px-3 py-2">
                <div className="flex flex-wrap gap-1.5">{memberTagPills(m.tags)}</div>
              </td>
              <td className="px-3 py-2 font-mono text-xs text-[var(--ubm-color-text-muted)]">
                {m.lastSubmittedAt}
              </td>
              <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                <MemberPublishSwitch
                  memberId={m.memberId}
                  publishState={m.publishState}
                  isDeleted={m.isDeleted}
                />
              </td>
              <td className="px-3 py-2">
                <button
                  type="button"
                  aria-label={`${m.fullName} を編集`}
                  className="rounded p-1 text-[var(--ubm-color-text-muted)] hover:bg-[var(--ubm-color-surface-panel-2)] hover:text-[var(--ubm-color-accent)]"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenRow(m.memberId);
                  }}
                >
                  ✎
                </button>
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
          {total} 件中 {Math.min(total, (page - 1) * pageSize + 1)}–
          {Math.min(total, page * pageSize)} 件目
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
