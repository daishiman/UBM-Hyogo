"use client";

import type { ReactNode } from "react";
import { cn } from "../../../../lib/cn";
import { AdminEmptyState } from "./AdminEmptyState";

export interface AdminQueueItem {
  id: string;
  listNode: ReactNode;
}

export interface AdminQueuePanelProps {
  items: AdminQueueItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  detail: ReactNode;
  emptyState?: ReactNode;
  listHeading?: string;
  detailHeading?: string;
  className?: string;
}

export function AdminQueuePanel({
  items,
  selectedId,
  onSelect,
  detail,
  emptyState,
  listHeading,
  detailHeading,
  className,
}: AdminQueuePanelProps) {
  return (
    <div
      className={cn("admin-queue-panel", className)}
      data-testid="admin-queue-panel"
    >
      <aside className="admin-queue-panel__list" aria-label={listHeading ?? "キュー一覧"}>
        {listHeading ? (
          <p className="admin-queue-panel__heading">{listHeading}</p>
        ) : null}
        {items.length === 0 ? (
          (emptyState ?? <AdminEmptyState title="未処理のアイテムはありません" />)
        ) : (
          <ul role="listbox" aria-label={listHeading ?? "queue items"}>
            {items.map((item) => {
              const isSelected = selectedId === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    data-selected={isSelected || undefined}
                    onClick={() => onSelect(item.id)}
                    className="admin-queue-panel__item"
                  >
                    {item.listNode}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </aside>
      <section className="admin-queue-panel__detail" aria-label={detailHeading ?? "詳細"}>
        {detailHeading ? (
          <p className="admin-queue-panel__heading">{detailHeading}</p>
        ) : null}
        {detail}
      </section>
    </div>
  );
}
