"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Chip } from "../ui/Chip";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { EmptyState } from "../ui/EmptyState";
import { useAdminMutation } from "../../features/admin/hooks/useAdminMutation";
import {
  applyLifecycleSuccess,
  parseTagLifecycleError,
  TAG_LIFECYCLE_DESCRIPTORS,
  type TagDefinitionItem,
  type TagLifecycleOperation,
} from "./tagCatalogLifecycle";
import { TagCatalogRow } from "./TagCatalogRow";

export interface TagCatalogListView {
  readonly total: number;
  readonly items: TagDefinitionItem[];
}

interface PendingOperation {
  readonly tag: TagDefinitionItem;
  readonly operation: TagLifecycleOperation;
}

interface TagCatalogPanelProps {
  readonly initial?: Partial<TagCatalogListView> | null | undefined;
  readonly query: string;
  readonly page: number;
  readonly pageSize: number;
}

export function TagCatalogPanel({
  initial,
  query,
  page,
  pageSize,
}: TagCatalogPanelProps) {
  const router = useRouter();
  const safeItems = Array.isArray(initial?.items) ? initial.items : [];
  const safeTotal = typeof initial?.total === "number" ? initial.total : 0;
  const [items, setItems] = useState(safeItems);
  const [searchText, setSearchText] = useState(query);
  const [pending, setPending] = useState<PendingOperation | null>(null);
  const [busy, setBusy] = useState<PendingOperation | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const reactivateMutation = useAdminMutation<TagDefinitionItem>(
    "/api/admin/tags",
    "POST",
    {
      refreshOnSuccess: false,
      successMessage: "タグを棚に戻しました",
    },
  );
  const deactivateMutation = useAdminMutation<void>("/api/admin/tags", "DELETE", {
    refreshOnSuccess: false,
    successMessage: "タグをしまいました",
    retry: { maxAttempts: 2 },
  });
  const physicalDeleteMutation = useAdminMutation<void>("/api/admin/tags", "DELETE", {
    refreshOnSuccess: false,
    successMessage: "タグを完全削除しました",
    retry: { maxAttempts: 2 },
  });

  const counts = useMemo(
    () =>
      items.reduce(
        (acc, item) => {
          if (item.active) acc.active += 1;
          else acc.inactive += 1;
          return acc;
        },
        { active: 0, inactive: 0 },
      ),
    [items],
  );

  const updateError = (tagId: string, message: string | null) => {
    setErrors((prev) => {
      const next = { ...prev };
      if (message) next[tagId] = message;
      else delete next[tagId];
      return next;
    });
  };

  const runOperation = async (target: PendingOperation) => {
    const descriptor = TAG_LIFECYCLE_DESCRIPTORS[target.operation];
    setBusy(target);
    updateError(target.tag.tagId, null);
    try {
      if (target.operation === "reactivate") {
        const row = await reactivateMutation.trigger(
          {},
          descriptor.endpoint(target.tag.tagId),
        );
        setItems((current) =>
          applyLifecycleSuccess(current, target.tag.tagId, target.operation, row),
        );
      } else if (target.operation === "deactivate") {
        await deactivateMutation.trigger({}, descriptor.endpoint(target.tag.tagId));
        setItems((current) =>
          applyLifecycleSuccess(current, target.tag.tagId, target.operation),
        );
      } else {
        await physicalDeleteMutation.trigger({}, descriptor.endpoint(target.tag.tagId));
        setItems((current) =>
          applyLifecycleSuccess(current, target.tag.tagId, target.operation),
        );
      }
    } catch (error) {
      if ((error as { name?: unknown } | null | undefined)?.name === "AbortError") return;
      updateError(
        target.tag.tagId,
        parseTagLifecycleError(error instanceof Error ? error : new Error(String(error)))
          .message,
      );
    } finally {
      setBusy(null);
      setPending(null);
    }
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    const trimmed = searchText.trim();
    if (trimmed) params.set("q", trimmed);
    params.set("pageSize", String(pageSize));
    router.push(`/admin/tags/catalog${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const onPage = (nextPage: number) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    params.set("page", String(nextPage));
    params.set("pageSize", String(pageSize));
    router.push(`/admin/tags/catalog?${params.toString()}`);
  };

  return (
    <section className="tag-catalog-panel" aria-label="タグカタログ">
      <Card className="tag-catalog-toolbar card-pad-lg">
        <form className="tag-catalog-search" role="search" onSubmit={onSubmit}>
          <label htmlFor="tag-catalog-search">タグ検索</label>
          <input
            id="tag-catalog-search"
            name="q"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="code / label"
          />
          <Button type="submit" variant="primary" size="sm">
            検索
          </Button>
        </form>
        <div className="chip-row" aria-label="タグ状態サマリ">
          <Chip tone="green">有効 {counts.active}件</Chip>
          <Chip tone="stone">停止中 {counts.inactive}件</Chip>
          <Chip tone="warm">全体 {safeTotal}件</Chip>
        </div>
      </Card>

      {items.length === 0 ? (
        <Card className="card-pad-lg">
          <EmptyState title="該当するタグはありません" />
        </Card>
      ) : (
        <div className="tag-catalog-list" data-testid="admin-tag-catalog-list">
          {items.map((tag) => (
            <TagCatalogRow
              key={tag.tagId}
              tag={tag}
              busyOperation={
                busy?.tag.tagId === tag.tagId ? busy.operation : null
              }
              errorMessage={errors[tag.tagId] ?? null}
              onOperation={(nextTag, operation) => {
                const next = { tag: nextTag, operation };
                if (operation === "physical-delete") {
                  setPending(next);
                } else {
                  void runOperation(next);
                }
              }}
            />
          ))}
        </div>
      )}

      <div className="tag-catalog-pager" aria-label="ページ移動">
        <Button
          size="sm"
          variant="soft"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          前へ
        </Button>
        <span>
          page {page} / {Math.max(1, Math.ceil(safeTotal / pageSize))}
        </span>
        <Button
          size="sm"
          variant="soft"
          disabled={page * pageSize >= safeTotal}
          onClick={() => onPage(page + 1)}
        >
          次へ
        </Button>
      </div>

      <ConfirmDialog
        open={pending?.operation === "physical-delete"}
        title="タグを完全削除しますか"
        description={
          pending
            ? `${pending.tag.label} は元に戻せません。使用中の場合は削除されず、使用人数を表示します。`
            : undefined
        }
        confirmLabel="完全削除"
        cancelLabel="戻る"
        isDestructive
        submitting={physicalDeleteMutation.isLoading}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (pending) void runOperation(pending);
        }}
      />
    </section>
  );
}
