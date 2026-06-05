// task-15: 一括操作 (publish / hide / soft-delete)
// issue-1036: 複数 member × 複数 tag の一括付与 / 解除（不変条件 #13 第3経路）を追加。
"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { patchMemberStatus, deleteMember } from "../../../../lib/admin/api";
import { useAdminMutation } from "../../hooks/useAdminMutation";
import {
  fetchAllTagMaster,
  type AdminTagRef,
  type BulkApplyMemberTagsResult,
  type BulkTagResultItem,
} from "../../api/members";
import { TagPill } from "../_shared/TagPill";

type Action = "publish" | "hide" | "soft-delete";
type TagMode = "assign" | "unassign";

const COLLAPSE_THRESHOLD = 24;

export interface BulkActionBarProps {
  readonly selectedIds: ReadonlyArray<string>;
  readonly onComplete: () => void;
  readonly membersById?: Readonly<Record<string, { readonly fullName: string }>>;
}

interface BulkTagSummary {
  assigned: number;
  unassigned: number;
  noop: number;
  skipped: BulkTagResultItem[];
  notFound: BulkTagResultItem[];
}

const summarize = (results: readonly BulkTagResultItem[]): BulkTagSummary => {
  const s: BulkTagSummary = {
    assigned: 0,
    unassigned: 0,
    noop: 0,
    skipped: [],
    notFound: [],
  };
  for (const r of results) {
    if (r.status === "assigned") s.assigned += 1;
    else if (r.status === "unassigned") s.unassigned += 1;
    else if (r.status === "noop") s.noop += 1;
    else if (r.status === "skipped_deleted") s.skipped.push(r);
    else if (r.status === "tag_not_found") s.notFound.push(r);
  }
  return s;
};

export function BulkActionBar({ selectedIds, onComplete, membersById }: BulkActionBarProps) {
  const [busy, setBusy] = useState<Action | null>(null);
  const [tagMode, setTagMode] = useState<TagMode>("assign");
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(() => new Set());
  const [available, setAvailable] = useState<AdminTagRef[]>([]);
  const [tagTotal, setTagTotal] = useState(0);
  const [serverSearchMode, setServerSearchMode] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const [bulkResult, setBulkResult] = useState<BulkTagSummary | null>(null);
  const knownTagsRef = useRef<Map<string, AdminTagRef>>(new Map());

  // 不変条件 #10: bulk mutation は useAdminMutation 経由で発火する。
  const bulkMut = useAdminMutation<BulkApplyMemberTagsResult>(
    "/api/admin/members/tags/bulk",
    "POST",
  );

  // tag master を初回ロード（read のみ。失敗時は picker を空にする）。
  useEffect(() => {
    let active = true;
    fetchAllTagMaster()
      .then((r) => {
        if (!active) return;
        for (const tag of r.available) {
          knownTagsRef.current.set(tag.tagId, tag);
        }
        setAvailable(r.available);
        setTagTotal(r.total);
        setServerSearchMode(r.truncated);
      })
      .catch(() => {
        if (!active) return;
        setAvailable([]);
        setTagTotal(0);
        setServerSearchMode(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => clearTimeout(id);
  }, [query]);

  const largeCatalog = available.length > COLLAPSE_THRESHOLD || serverSearchMode;

  const visibleTags = useMemo(() => {
    if (!largeCatalog || !debouncedQuery) return available;
    const normalized = debouncedQuery.toLowerCase();
    return available.filter(
      (tag) =>
        tag.label.toLowerCase().includes(normalized) ||
        tag.code.toLowerCase().includes(normalized) ||
        tag.category.toLowerCase().includes(normalized),
    );
  }, [available, debouncedQuery, largeCatalog]);

  const selectedRefs = useMemo(
    () =>
      [...selectedTagIds].map(
        (tagId) =>
          knownTagsRef.current.get(tagId) ??
          ({ tagId, code: tagId, label: tagId, category: "" } satisfies AdminTagRef),
      ),
    [selectedTagIds],
  );

  // category 別にグルーピング（新規 primitive を生やさず TagPill を再利用）。
  const groupedTags = useMemo(() => {
    const m = new Map<string, AdminTagRef[]>();
    for (const t of visibleTags) {
      const arr = m.get(t.category) ?? [];
      arr.push(t);
      m.set(t.category, arr);
    }
    return [...m.entries()];
  }, [visibleTags]);

  const tagLabelById = useMemo(() => {
    const m = new Map<string, string>();
    for (const t of available) {
      m.set(t.tagId, t.label);
    }
    return m;
  }, [available]);

  const resolveMemberLabel = (memberId: string) => {
    const fullName = membersById?.[memberId]?.fullName.trim();
    return fullName || memberId;
  };

  const resolveTagLabel = (tagId: string) => tagLabelById.get(tagId)?.trim() || `${tagId}（未登録）`;

  if (selectedIds.length === 0) return null;

  const run = async (action: Action) => {
    if (selectedIds.length === 0) return;
    setBusy(action);
    try {
      for (const memberId of selectedIds) {
        if (action === "publish") {
          await patchMemberStatus(memberId, { publishState: "public" });
        } else if (action === "hide") {
          await patchMemberStatus(memberId, { publishState: "hidden" });
        } else if (action === "soft-delete") {
          await deleteMember(memberId, "bulk-delete");
        }
      }
      onComplete();
    } finally {
      // FB-STATE-DETAIL-01: 正常 / 例外 / unmount どの経路でも null
      setBusy(null);
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) next.delete(tagId);
      else next.add(tagId);
      return next;
    });
  };

  const toggleCategory = (category: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  const runBulkTags = async () => {
    if (selectedIds.length === 0 || selectedTagIds.size === 0) return;
    try {
      const res = await bulkMut.trigger({
        memberIds: [...selectedIds],
        tagIds: [...selectedTagIds],
        op: tagMode,
      });
      setBulkResult(summarize(res.results));
      onComplete();
    } catch {
      // 失敗時の toast / error は useAdminMutation が処理する。
    }
  };

  const tagBusy = bulkMut.isLoading;
  const tagDisabled = selectedTagIds.size === 0 || tagBusy || busy !== null;
  const verb = tagMode === "assign" ? "付与" : "解除";

  return (
    <div
      role="region"
      aria-label="一括操作"
      className="sticky bottom-4 z-30 mx-auto flex max-w-3xl flex-col gap-3 rounded-[var(--ubm-radius-md)] border border-[var(--ubm-color-border-strong)] bg-[var(--ubm-color-surface-panel)] p-3 shadow-[var(--ubm-shadow-md,0_4px_12px_rgba(0,0,0,0.08))]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span aria-live="polite" className="text-sm text-[var(--ubm-color-text-secondary)]">
          {selectedIds.length} 件選択中
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded border border-[var(--ubm-color-border-default)] px-3 py-1 text-sm hover:bg-[var(--ubm-color-surface-panel-2)] disabled:opacity-50"
            disabled={busy !== null}
            onClick={() => run("publish")}
          >
            {busy === "publish" ? "公開中…" : "公開"}
          </button>
          <button
            type="button"
            className="rounded border border-[var(--ubm-color-border-default)] px-3 py-1 text-sm hover:bg-[var(--ubm-color-surface-panel-2)] disabled:opacity-50"
            disabled={busy !== null}
            onClick={() => run("hide")}
          >
            {busy === "hide" ? "非公開中…" : "非公開"}
          </button>
          <button
            type="button"
            className="rounded border border-[var(--ubm-color-danger)] px-3 py-1 text-sm text-[var(--ubm-color-danger)] hover:bg-[var(--ubm-color-danger-soft)] disabled:opacity-50"
            disabled={busy !== null}
            onClick={() => run("soft-delete")}
          >
            {busy === "soft-delete" ? "削除中…" : "論理削除"}
          </button>
        </div>
      </div>

      {/* issue-1036: tag 一括付与 / 解除セクション */}
      <section
        aria-label="タグ一括付与・解除"
        className="flex flex-col gap-2 border-t border-[var(--ubm-color-border-default)] pt-3"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-[var(--ubm-color-text-primary)]">タグ</span>
          <div role="group" aria-label="付与モード" className="flex gap-1">
            <button
              type="button"
              aria-pressed={tagMode === "assign"}
              className={[
                "rounded border px-2 py-0.5 text-xs",
                tagMode === "assign"
                  ? "border-[var(--ubm-color-accent)] bg-[var(--ubm-color-accent-soft)] text-[var(--ubm-color-accent-ink)]"
                  : "border-[var(--ubm-color-border-default)] text-[var(--ubm-color-text-secondary)]",
              ].join(" ")}
              onClick={() => setTagMode("assign")}
            >
              付与
            </button>
            <button
              type="button"
              aria-pressed={tagMode === "unassign"}
              className={[
                "rounded border px-2 py-0.5 text-xs",
                tagMode === "unassign"
                  ? "border-[var(--ubm-color-accent)] bg-[var(--ubm-color-accent-soft)] text-[var(--ubm-color-accent-ink)]"
                  : "border-[var(--ubm-color-border-default)] text-[var(--ubm-color-text-secondary)]",
              ].join(" ")}
              onClick={() => setTagMode("unassign")}
            >
              解除
            </button>
          </div>
        </div>

        {largeCatalog && (
          <div className="flex flex-col gap-2">
            {/* client-side filter 用途。mutation form ではないため FormField 不変条件の対象外。 */}
            <label className="flex flex-col gap-1 text-xs text-[var(--ubm-color-text-secondary)]">
              <span>タグ検索</span>
              <input
                type="search"
                aria-label="タグを検索"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="タグを検索"
                className="rounded border border-[var(--ubm-color-border-default)] bg-[var(--ubm-color-surface-panel)] px-2 py-1 text-xs text-[var(--ubm-color-text-primary)]"
              />
            </label>
            <p className="text-xs text-[var(--ubm-color-text-secondary)]">
              {tagTotal > 0
                ? `全 ${tagTotal} 件中 ${visibleTags.length} 件表示`
                : `${visibleTags.length} 件表示`}
              {serverSearchMode ? "（上限まで取得。必要なら検索で絞り込み）" : ""}
            </p>
          </div>
        )}

        {largeCatalog && selectedRefs.length > 0 && (
          <div
            role="group"
            aria-label="選択中のタグ"
            className="flex flex-wrap items-center gap-1.5 rounded border border-[var(--ubm-color-border-default)] bg-[var(--ubm-color-surface-panel-2)] p-2"
          >
            <span className="text-xs text-[var(--ubm-color-text-secondary)]">選択中</span>
            {selectedRefs.map((tag) => (
              <TagPill
                key={tag.tagId}
                selected
                onClick={() => toggleTag(tag.tagId)}
                disabled={tagBusy}
                title={tag.code}
              >
                {tag.label}
              </TagPill>
            ))}
          </div>
        )}

        {groupedTags.length === 0 ? (
          <p className="text-xs text-[var(--ubm-color-text-secondary)]">
            付与可能なタグがありません
          </p>
        ) : (
          <div
            className={[
              "flex flex-col gap-2",
              largeCatalog ? "max-h-[40vh] overflow-y-auto pr-1" : "",
            ].join(" ")}
          >
            {groupedTags.map(([category, tags]) => (
              <div key={category} className="flex flex-col gap-1">
                {largeCatalog ? (
                  <button
                    type="button"
                    aria-expanded={!collapsed.has(category)}
                    className="w-fit rounded border border-[var(--ubm-color-border-default)] px-2 py-0.5 text-xs text-[var(--ubm-color-text-secondary)] hover:bg-[var(--ubm-color-surface-panel-2)]"
                    onClick={() => toggleCategory(category)}
                  >
                    {category} ({tags.length})
                  </button>
                ) : (
                  <span className="text-xs text-[var(--ubm-color-text-secondary)]">
                    {category}
                  </span>
                )}
                {!collapsed.has(category) && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {tags.map((t) => (
                      <TagPill
                        key={t.tagId}
                        selected={selectedTagIds.has(t.tagId)}
                        onClick={() => toggleTag(t.tagId)}
                        disabled={tagBusy}
                        title={t.code}
                      >
                        {t.label}
                      </TagPill>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded border border-[var(--ubm-color-accent)] bg-[var(--ubm-color-accent-soft)] px-3 py-1 text-sm text-[var(--ubm-color-accent-ink)] hover:bg-[var(--ubm-color-surface-panel-2)] disabled:opacity-50"
            disabled={tagDisabled}
            onClick={runBulkTags}
          >
            {tagBusy
              ? "処理中…"
              : `${selectedIds.length}人 × ${selectedTagIds.size}タグ を${verb}`}
          </button>
        </div>

        {bulkResult && (
          <div
            data-testid="bulk-tag-result"
            aria-live="polite"
            className="flex flex-col gap-1 text-xs text-[var(--ubm-color-text-secondary)]"
          >
            <span data-testid="bulk-tag-result-counts">
              付与 {bulkResult.assigned} / 解除 {bulkResult.unassigned} / 変更なし{" "}
              {bulkResult.noop} / 退会済みスキップ {bulkResult.skipped.length} / 未登録タグ{" "}
              {bulkResult.notFound.length}
            </span>
            {bulkResult.skipped.length > 0 && (
              <ul data-testid="bulk-tag-result-skipped" className="list-disc pl-4">
                {bulkResult.skipped.map((r) => (
                  <li key={`skip-${r.memberId}-${r.tagId}`}>
                    退会済みのためスキップ: {resolveMemberLabel(r.memberId)}
                  </li>
                ))}
              </ul>
            )}
            {bulkResult.notFound.length > 0 && (
              <ul data-testid="bulk-tag-result-not-found" className="list-disc pl-4">
                {bulkResult.notFound.map((r) => (
                  <li key={`nf-${r.memberId}-${r.tagId}`}>
                    未登録タグのためスキップ: {resolveTagLabel(r.tagId)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
