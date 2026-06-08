"use client";

import { useMemo, useState } from "react";
import { Chip } from "../../../../components/ui/Chip";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { Input } from "../../../../components/ui/Input";
import type { AdminTagRef } from "../../api/tags";
import { TagMasterEditForm } from "./TagMasterEditForm";

export interface TagMasterPanelProps {
  readonly initialTags: readonly AdminTagRef[];
  readonly total: number;
}

export function TagMasterPanel({ initialTags, total }: TagMasterPanelProps) {
  const [tags, setTags] = useState<AdminTagRef[]>([...initialTags]);
  const [selectedId, setSelectedId] = useState(initialTags[0]?.tagId ?? null);
  const [query, setQuery] = useState("");

  const visibleTags = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tags;
    return tags.filter((tag) =>
      [tag.code, tag.label, tag.category].some((value) => value.toLowerCase().includes(q)),
    );
  }, [query, tags]);

  const selected = tags.find((tag) => tag.tagId === selectedId) ?? null;

  const onSaved = (updated: AdminTagRef) => {
    setTags((current) => current.map((tag) => (tag.tagId === updated.tagId ? updated : tag)));
    setSelectedId(updated.tagId);
  };

  return (
    <section className="tag-master-panel" aria-label="タグ管理">
      <div className="tag-master-toolbar">
        <Input
          aria-label="タグ検索"
          value={query}
          placeholder="code / 表示名 / category"
          onChange={(event) => setQuery(event.currentTarget.value)}
        />
        <Chip tone="stone">
          {tags.length}/{total}件
        </Chip>
      </div>
      <div className="tag-master-grid">
        <section
          className="tag-master-card card-pad-lg"
          aria-label="タグ一覧"
          data-testid="admin-tag-master-list"
        >
          <div className="tag-master-card__head">
            <h2>タグ一覧</h2>
            <Chip tone="stone">{visibleTags.length}件</Chip>
          </div>
          {visibleTags.length === 0 ? (
            <EmptyState title="該当するタグはありません" />
          ) : (
            <ul className="tag-master-list" aria-label="タグ一覧">
              {visibleTags.map((tag) => (
                <li key={tag.tagId}>
                  <button
                    type="button"
                    className="tag-master-item"
                    aria-pressed={tag.tagId === selectedId}
                    data-selected={tag.tagId === selectedId || undefined}
                    onClick={() => setSelectedId(tag.tagId)}
                  >
                    <span className="tag-master-item__body">
                      <span className="tag-master-item__title">{tag.label}</span>
                      <span className="tag-master-item__meta">
                        <code>{tag.code}</code> · {tag.category}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
        <TagMasterEditForm tag={selected} onSaved={onSaved} />
      </div>
    </section>
  );
}
