"use client";
// 06c: TagQueuePanel — 左 queue list + 右 review pane（resolve は drawer に委譲）
// 不変条件 #13: tag 直接更新 endpoint なし。queue resolve POST のみ。
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Chip } from "../ui/Chip";
import { EmptyState } from "../ui/EmptyState";
import { Icon } from "../ui/Icon";
import { TagsQueueResolveDrawer } from "./TagsQueueResolveDrawer";

export type TagQueueStatus = "queued" | "reviewing" | "resolved" | "rejected" | "dlq";

export interface TagQueueItem {
  queueId: string;
  memberId: string;
  responseId: string;
  status: TagQueueStatus;
  suggestedTagsJson: string;
  reason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TagQueueListView {
  total: number;
  items: TagQueueItem[];
}

const parseTags = (json: string): string[] => {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v.filter((t): t is string => typeof t === "string") : [];
  } catch {
    return [];
  }
};

const STATUS_OPTIONS: readonly (TagQueueStatus | "")[] = [
  "",
  "queued",
  "reviewing",
  "resolved",
  "rejected",
  "dlq",
];

const STATUS_LABELS: Record<TagQueueStatus | "", string> = {
  "": "すべて",
  queued: "未対応",
  reviewing: "対応中",
  resolved: "解決済",
  rejected: "却下",
  dlq: "DLQ",
};

const statusTone = (status: TagQueueStatus) => {
  if (status === "resolved") return "green";
  if (status === "queued" || status === "reviewing") return "amber";
  if (status === "rejected") return "red";
  return "stone";
};

interface Props {
  readonly initial: TagQueueListView;
  readonly filter: TagQueueStatus | undefined;
  readonly focusMemberId: string | null;
}

export function TagQueuePanel({ initial, filter, focusMemberId }: Props) {
  const router = useRouter();
  const items = useMemo(() => {
    if (!focusMemberId) return initial.items;
    const focused = initial.items.filter((i) => i.memberId === focusMemberId);
    const others = initial.items.filter((i) => i.memberId !== focusMemberId);
    return [...focused, ...others];
  }, [initial.items, focusMemberId]);

  const [selected, setSelected] = useState<string | null>(items[0]?.queueId ?? null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const current = items.find((i) => i.queueId === selected) ?? null;
  const currentTags = current ? parseTags(current.suggestedTagsJson) : [];
  const resolvedItems = useMemo(
    () => initial.items.filter((i) => i.status === "resolved"),
    [initial.items],
  );

  const onFilter = (next: TagQueueStatus | "") => {
    const params = new URLSearchParams();
    if (next) params.set("status", next);
    if (focusMemberId) params.set("memberId", focusMemberId);
    router.push(`/admin/tags${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <section aria-label="タグキュー" className="tag-queue-panel">
      <div role="group" aria-label="ステータス絞込" className="chip-row">
        {STATUS_OPTIONS.map((v) => (
          <button
            key={v || "all"}
            type="button"
            className="tag-queue-filter"
            aria-pressed={filter === (v || undefined)}
            onClick={() => onFilter(v as TagQueueStatus | "")}
          >
            {STATUS_LABELS[v]}
          </button>
        ))}
      </div>
      {focusMemberId && (
        <p className="tag-queue-focus muted">
          絞込: memberId = <code>{focusMemberId}</code>
        </p>
      )}

      <div className="tag-queue-grid">
        <Card
          aria-label="キュー一覧"
          className="tag-queue-card card-pad-lg"
          data-testid="admin-tag-queue-list"
        >
          <div className="tag-queue-card__head">
            <h2>割当キュー</h2>
            <Chip tone="stone">{items.length}件</Chip>
          </div>
          {items.length === 0 ? (
            <EmptyState title="該当するキューはありません" />
          ) : (
            <ul aria-label="キュー一覧" className="tag-queue-list">
              {items.map((it) => (
                <li key={it.queueId}>
                  <button
                    type="button"
                    className="tag-queue-item"
                    onClick={() => setSelected(it.queueId)}
                    aria-pressed={selected === it.queueId}
                    data-selected={selected === it.queueId || undefined}
                  >
                    <Avatar name={it.memberId} memberId={it.memberId} size="sm" />
                    <span className="tag-queue-item__body">
                      <span className="tag-queue-item__title">{it.memberId}</span>
                      <span className="tag-queue-item__meta">{it.createdAt}</span>
                    </span>
                    <Chip tone={statusTone(it.status)}>{STATUS_LABELS[it.status]}</Chip>
                    <Icon name="chevron-down" size="sm" className="tag-queue-item__icon" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {resolvedItems.length > 0 ? (
            <section className="tag-queue-tagged" aria-label="解決済みタグ">
              <div className="eyebrow">TAGGED</div>
              <ul data-testid="admin-tag-queue-resolved" className="tag-queue-list">
                {resolvedItems.slice(0, 4).map((it) => (
                  <li key={it.queueId}>
                    <button
                      type="button"
                      className="tag-queue-item tag-queue-item--quiet"
                      onClick={() => setSelected(it.queueId)}
                    >
                      <Avatar name={it.memberId} memberId={it.memberId} size="sm" />
                      <span className="tag-queue-item__body">
                        <span className="tag-queue-item__title">{it.memberId}</span>
                        <span className="chip-row">
                          {parseTags(it.suggestedTagsJson)
                            .slice(0, 3)
                            .map((tag) => (
                              <Chip key={tag}>{tag}</Chip>
                            ))}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </Card>

        <Card
          aria-label="レビューパネル"
          className="tag-queue-card tag-queue-review card-pad-lg sticky-top"
          data-testid="admin-tag-review-panel"
        >
          {!current && <EmptyState title="左のキューから項目を選択してください。" />}
          {current && (
            <article className="tag-queue-review__body">
              <header className="tag-queue-review__head">
                <Avatar name={current.memberId} memberId={current.memberId} size="lg" />
                <div>
                  <h2>queue: {current.queueId}</h2>
                  <p className="muted">
                    memberId <code>{current.memberId}</code> · status{" "}
                    <strong>{current.status}</strong>
                  </p>
                </div>
              </header>
              <section>
                <div className="eyebrow">SUGGESTED TAGS</div>
                <div className="chip-row tag-queue-suggested">
                  {currentTags.length > 0 ? (
                    currentTags.map((t) => (
                      <Chip key={t} tone="warm">
                        {t}
                      </Chip>
                    ))
                  ) : (
                    <p className="muted">提案タグなし</p>
                  )}
                </div>
              </section>
              {current.reason && <p>理由: {current.reason}</p>}
              <Button
                variant="primary"
                aria-label="resolve"
                onClick={() => setDrawerOpen(true)}
              >
                Resolve
              </Button>
            </article>
          )}
        </Card>
      </div>

      {current && (
        <TagsQueueResolveDrawer
          key={current.queueId}
          queueId={current.queueId}
          memberId={current.memberId}
          suggestedTags={currentTags}
          status={current.status}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onResolved={() => {
            setDrawerOpen(false);
          }}
        />
      )}
    </section>
  );
}
