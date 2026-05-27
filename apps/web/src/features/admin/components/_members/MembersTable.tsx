// followup-001 T-5.3: プロトタイプ準拠の table 構成に刷新。
// 列: checkbox / Avatar+name+occupation / mail mono / 区画 Chip(dot) + ステータス Chip /
//     tags Chip × max 2 + `+N` / 最終更新 mono / Switch+公開ラベル or 退会 Chip / edit icon ghost button
"use client";
import type { AdminMemberListView } from "@ubm-hyogo/shared";
import { Avatar } from "../../../../components/ui/Avatar";
import { Button } from "../../../../components/ui/Button";
import { Chip } from "../../../../components/ui/Chip";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { Pagination } from "../../../../components/ui/Pagination";
import { Switch } from "../../../../components/ui/Switch";
import { statusTone, zoneTone } from "../../../../lib/tones";
import { stringHashHue, type Tag } from "../../adapters/members-view-model";

type Member = AdminMemberListView["members"][number];
type MemberSummary = {
  occupation?: string;
  ubmZone?: string | null;
  ubmMembershipType?: string | null;
  updatedAt?: string;
};

export interface MembersTableProps {
  readonly items: ReadonlyArray<Member>;
  readonly selected: ReadonlySet<string>;
  readonly onToggleSelect: (memberId: string) => void;
  readonly onToggleSelectAll: () => void;
  readonly onOpenRow: (memberId: string) => void;
  readonly onTogglePublish?: (memberId: string, next: boolean) => void;
  /** memberId => tag list（adapter から injection） */
  readonly tagsByMember?: ReadonlyMap<string, ReadonlyArray<Tag>>;
  /** memberId => 派生 summary（occupation / ubmZone 等） */
  readonly summariesByMember?: ReadonlyMap<
    string,
    MemberSummary
  >;
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

const PUBLISH_LABEL: Record<string, string> = {
  public: "公開",
  member_only: "会員限定",
  hidden: "非公開",
  private: "非公開",
};

export function MembersTable({
  items,
  selected,
  onToggleSelect,
  onToggleSelectAll,
  onOpenRow,
  onTogglePublish,
  tagsByMember,
  summariesByMember,
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
    <div
      className="ui-card w-full max-w-full overflow-hidden rounded-[var(--ubm-radius-md)] border border-[var(--ubm-color-border-default)] bg-[var(--ubm-color-surface-panel)]"
      data-component="members-table"
    >
      <table className="w-full table-fixed text-left text-sm">
        <caption className="sr-only">会員一覧</caption>
        <thead>
          <tr className="border-b border-[var(--ubm-color-border-default)] bg-[var(--ubm-color-surface-panel-2)] text-xs uppercase tracking-wide text-[var(--ubm-color-text-muted)]">
            <th scope="col" className="w-10 px-2 py-2 md:px-3">
              <span className="sr-only">選択</span>
              <input
                type="checkbox"
                aria-label="全選択"
                checked={allSelected}
                onChange={onToggleSelectAll}
              />
            </th>
            <th scope="col" className="px-2 py-2 md:px-3">メンバー</th>
            <th scope="col" className="hidden px-2 py-2 md:table-cell md:px-3">メール</th>
            <th scope="col" className="hidden px-2 py-2 lg:table-cell md:px-3">区画 / ステータス</th>
            <th scope="col" className="hidden px-2 py-2 lg:table-cell md:px-3">タグ</th>
            <th scope="col" className="hidden px-2 py-2 xl:table-cell md:px-3">最終更新</th>
            <th scope="col" className="w-20 px-2 py-2 md:w-36 md:px-3">公開</th>
            <th scope="col" className="w-12 px-2 py-2 md:px-3">
              <span className="sr-only">編集</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((m) => {
            const summary: MemberSummary = summariesByMember?.get(m.memberId) ?? m;
            const tags = tagsByMember?.get(m.memberId) ?? m.tags ?? [];
            const updatedAt = summary?.updatedAt ?? m.lastSubmittedAt;
            const isPublic = m.publishState === "public";
            return (
              <tr
                key={m.memberId}
                className="border-b border-[var(--ubm-color-border-default)] last:border-b-0 hover:bg-[var(--ubm-color-surface-panel-2)]"
                data-testid={`admin-members-row-${m.memberId}`}
              >
                <td className="px-2 py-2 md:px-3">
                  <input
                    type="checkbox"
                    aria-label={`${m.fullName} を選択`}
                    checked={selected.has(m.memberId)}
                    onChange={() => onToggleSelect(m.memberId)}
                  />
                </td>
                <td className="min-w-0 px-2 py-2 md:px-3">
                  <button
                    type="button"
                    className="flex min-w-0 items-center gap-2 text-left md:gap-3"
                    onClick={() => onOpenRow(m.memberId)}
                  >
                    <Avatar name={m.fullName} memberId={m.memberId} hue={stringHashHue(m.memberId)} size="sm" />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate font-medium text-[var(--ubm-color-text-primary)]">{m.fullName}</span>
                      {summary?.occupation ? (
                        <span className="truncate text-xs text-[var(--ubm-color-text-muted)]" data-component="member-occupation">
                          {summary.occupation}
                        </span>
                      ) : null}
                    </span>
                  </button>
                </td>
                <td className="hidden break-all px-2 py-2 font-mono text-xs text-[var(--ubm-color-text-secondary)] md:table-cell md:px-3">
                  {maskEmail(m.responseEmail)}
                </td>
                <td className="hidden px-2 py-2 lg:table-cell md:px-3">
                  <div className="flex flex-wrap items-center gap-1" data-component="member-zone-status">
                    {summary?.ubmZone ? (
                      <Chip tone={zoneTone(summary.ubmZone)} dot>
                        {summary.ubmZone}
                      </Chip>
                    ) : null}
                    {summary?.ubmMembershipType ? (
                      <Chip tone={statusTone(summary.ubmMembershipType)}>
                        {summary.ubmMembershipType}
                      </Chip>
                    ) : null}
                    {!summary?.ubmZone && !summary?.ubmMembershipType ? (
                      <Chip tone="neutral">未設定</Chip>
                    ) : null}
                  </div>
                </td>
                <td className="hidden px-2 py-2 lg:table-cell md:px-3">
                  {tags.length === 0 ? (
                    <Chip tone="warning" dot>
                      未タグ
                    </Chip>
                  ) : (
                    <div className="flex flex-wrap items-center gap-1" data-component="member-tags">
                      {tags.slice(0, 2).map((t) => (
                        <Chip key={t.code}>{t.label}</Chip>
                      ))}
                      {tags.length > 2 ? <Chip tone="neutral">{`+${tags.length - 2}`}</Chip> : null}
                    </div>
                  )}
                </td>
                <td className="hidden break-all px-2 py-2 font-mono text-xs text-[var(--ubm-color-text-muted)] xl:table-cell md:px-3">
                  {updatedAt}
                </td>
                <td className="px-2 py-2 md:px-3">
                  {m.isDeleted ? (
                    <Chip tone="danger">退会</Chip>
                  ) : (
                    <div className="flex min-w-0 flex-col gap-1 md:flex-row md:items-center md:gap-2" data-component="publish-toggle">
                      <Switch
                        checked={isPublic}
                        label={`${m.fullName} を公開`}
                        onChange={(next) => onTogglePublish?.(m.memberId, next)}
                      />
                      <span className="truncate text-xs text-[var(--ubm-color-text-secondary)]">
                        {PUBLISH_LABEL[m.publishState] ?? m.publishState}
                      </span>
                    </div>
                  )}
                </td>
                <td className="px-2 py-2 md:px-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`${m.fullName} を編集`}
                    onClick={() => onOpenRow(m.memberId)}
                  >
                    ✎
                  </Button>
                </td>
              </tr>
            );
          })}
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
