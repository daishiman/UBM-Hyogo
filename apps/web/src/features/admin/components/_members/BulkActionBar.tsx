// task-15: 一括操作 (publish / hide / soft-delete)
"use client";
import { useState } from "react";
import { patchMemberStatus, deleteMember } from "../../../../lib/admin/api";

type Action = "publish" | "hide" | "soft-delete";

export interface BulkActionBarProps {
  readonly selectedIds: ReadonlyArray<string>;
  readonly onComplete: () => void;
}

export function BulkActionBar({ selectedIds, onComplete }: BulkActionBarProps) {
  const [busy, setBusy] = useState<Action | null>(null);

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

  return (
    <div
      role="region"
      aria-label="一括操作"
      className="sticky bottom-4 z-30 mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 rounded-[var(--ubm-radius-md)] border border-[var(--ubm-color-border-strong)] bg-[var(--ubm-color-surface-panel)] p-3 shadow-[var(--ubm-shadow-md,0_4px_12px_rgba(0,0,0,0.08))]"
    >
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
  );
}
