"use client";

import { useMemo, useState } from "react";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Chip } from "../ui/Chip";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { EmptyState } from "../ui/EmptyState";
import { Input } from "../ui/Input";
import { TagMasterEditForm } from "../../features/admin/components/_tags/TagMasterEditForm";
import { useAdminMutation } from "../../features/admin/hooks/useAdminMutation";
import {
  countTagDefinitions,
  filterTagDefinitions,
  type TagDefinitionListView,
} from "./tagDefinitionView";
import { TagDefinitionCreateForm } from "./TagDefinitionCreateForm";
import { TagCatalogRow } from "./TagCatalogRow";
import {
  applyLifecycleSuccess,
  parseTagLifecycleError,
  TAG_LIFECYCLE_DESCRIPTORS,
  type TagDefinitionItem,
  type TagLifecycleOperation,
} from "./tagCatalogLifecycle";

interface PendingOperation {
  readonly tag: TagDefinitionItem;
  readonly operation: TagLifecycleOperation;
}

export interface TagDefinitionPanelProps {
  readonly initial: TagDefinitionListView;
}

export function TagDefinitionPanel({ initial }: TagDefinitionPanelProps) {
  const [items, setItems] = useState<TagDefinitionItem[]>([...initial.items]);
  const [selectedId, setSelectedId] = useState<string | null>(
    initial.items[0]?.tagId ?? null,
  );
  const [query, setQuery] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [pending, setPending] = useState<PendingOperation | null>(null);
  const [busy, setBusy] = useState<PendingOperation | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const reactivateMutation = useAdminMutation<TagDefinitionItem>(
    "/api/admin/tags",
    "POST",
    { refreshOnSuccess: false, successMessage: "タグを棚に戻しました" },
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

  const visibleItems = useMemo(
    () => filterTagDefinitions(items, query, includeInactive),
    [includeInactive, items, query],
  );
  const counts = useMemo(() => countTagDefinitions(items), [items]);
  const selected = items.find((tag) => tag.tagId === selectedId) ?? null;

  const updateError = (tagId: string, message: string | null) => {
    setErrors((prev) => {
      const next = { ...prev };
      if (message) next[tagId] = message;
      else delete next[tagId];
      return next;
    });
  };

  const mergeTag = (tag: TagDefinitionItem) => {
    setItems((current) => {
      const next = current.map((item) =>
        item.tagId === tag.tagId ? { ...item, ...tag } : item,
      );
      return current.some((item) => item.tagId === tag.tagId) ? next : [tag, ...current];
    });
    setSelectedId(tag.tagId);
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
        if (selectedId === target.tag.tagId) setSelectedId(null);
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

  return (
    <section className="tag-definition-panel" aria-label="タグ定義">
      <Card className="tag-master-toolbar card-pad-lg">
        <Input
          aria-label="タグ検索"
          value={query}
          placeholder="code / 表示名 / category"
          onChange={(event) => setQuery(event.currentTarget.value)}
        />
        <label className="tag-definition-toggle">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(event) => setIncludeInactive(event.currentTarget.checked)}
          />
          停止中も表示
        </label>
        <div className="chip-row" aria-label="タグ状態サマリ">
          <Chip tone="green">有効 {counts.active}件</Chip>
          <Chip tone="stone">停止中 {counts.inactive}件</Chip>
          <Chip tone="warm">全体 {counts.total}/{initial.total}件</Chip>
        </div>
      </Card>

      <div className="tag-master-grid">
        <section
          className="tag-master-card card-pad-lg"
          aria-label="タグ一覧"
          data-testid="admin-tag-definition-list"
        >
          <div className="tag-master-card__head">
            <h2>タグ一覧</h2>
            <Chip tone="stone">{visibleItems.length}件</Chip>
          </div>
          {visibleItems.length === 0 ? (
            <EmptyState title="該当するタグはありません" />
          ) : (
            <div className="tag-catalog-list">
              {visibleItems.map((tag) => (
                <div key={tag.tagId} className="tag-definition-row-wrap">
                  <Button
                    type="button"
                    variant={tag.tagId === selectedId ? "primary" : "soft"}
                    size="sm"
                    onClick={() => setSelectedId(tag.tagId)}
                    aria-pressed={tag.tagId === selectedId}
                  >
                    編集対象
                  </Button>
                  <TagCatalogRow
                    tag={tag}
                    busyOperation={busy?.tag.tagId === tag.tagId ? busy.operation : null}
                    errorMessage={errors[tag.tagId] ?? null}
                    onOperation={(nextTag, operation) => {
                      const next = { tag: nextTag, operation };
                      if (operation === "physical-delete") setPending(next);
                      else void runOperation(next);
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="tag-definition-side">
          <TagDefinitionCreateForm onCreated={mergeTag} />
          <TagMasterEditForm
            tag={selected}
            onSaved={(updated) => {
              const current = items.find((item) => item.tagId === updated.tagId);
              mergeTag({ ...updated, active: current?.active ?? true });
            }}
          />
        </div>
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
