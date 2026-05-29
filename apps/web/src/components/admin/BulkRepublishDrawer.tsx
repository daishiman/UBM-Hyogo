// issue-958 Track B: hidden / member_only な member を一括 public 化するための drawer。
// 既存 Drawer primitive を使用、選択は checkbox、進捗は progressbar role で公開する。

"use client";

import { useEffect, useState } from "react";
import { Drawer } from "../ui/Drawer";
import { Button } from "../ui/Button";
import { useBulkRepublish } from "../../features/admin/hooks/useBulkRepublish";

export interface BulkRepublishCandidate {
  readonly memberId: string;
  readonly displayName: string;
  readonly publishState: "hidden" | "member_only";
  readonly hiddenReason: string | null;
}

export interface BulkRepublishDrawerProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly candidates: ReadonlyArray<BulkRepublishCandidate>;
  readonly onCompleted: () => void;
}

export function BulkRepublishDrawer({
  open,
  onClose,
  candidates,
  onCompleted,
}: BulkRepublishDrawerProps) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const { state, progress, start, reset } = useBulkRepublish();

  useEffect(() => {
    if (!open) {
      setSelected(new Set());
      reset();
    }
  }, [open, reset]);

  // 完了 + 失敗ゼロで自動 close + refetch
  useEffect(() => {
    if (state === "done" && progress.failed === 0 && progress.total > 0) {
      onCompleted();
      onClose();
    }
  }, [state, progress, onCompleted, onClose]);

  const toggle = (memberId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) next.delete(memberId);
      else next.add(memberId);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === candidates.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(candidates.map((c) => c.memberId)));
    }
  };

  const handleStart = () => {
    const targets = candidates
      .filter((c) => selected.has(c.memberId))
      .map((c) => ({
        memberId: c.memberId,
        currentPublishState: c.publishState,
      }));
    void start(targets);
  };

  const running = state === "running";
  const done = state === "done";
  const failuresById = new Map(progress.failures.map((f) => [f.memberId, f]));

  return (
    <Drawer open={open} onClose={onClose} title="一括公開復帰">
      <div className="flex flex-col gap-3" data-region="bulk-republish-drawer">
        <p className="text-sm text-[var(--ubm-color-text-secondary)]">
          現在 hidden / member_only の会員 {candidates.length} 名から、公開に戻す対象を選択してください。
        </p>

        {candidates.length === 0 ? (
          <p className="text-sm">対象会員はいません。</p>
        ) : (
          <>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selected.size > 0 && selected.size === candidates.length}
                onChange={toggleAll}
                disabled={running}
                data-testid="bulk-republish-select-all"
              />
              全選択
            </label>
            <ul className="flex flex-col gap-1 max-h-64 overflow-y-auto">
              {candidates.map((c) => {
                const fail = failuresById.get(c.memberId);
                return (
                  <li
                    key={c.memberId}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selected.has(c.memberId)}
                        onChange={() => toggle(c.memberId)}
                        disabled={running}
                        data-testid={`bulk-republish-row-${c.memberId}`}
                      />
                      <span>{c.displayName}</span>
                      <span className="text-xs text-[var(--ubm-color-text-muted)]">
                        ({c.publishState})
                      </span>
                    </label>
                    {fail ? (
                      <span
                        className="text-xs text-[var(--ubm-color-danger)]"
                        data-testid={`bulk-republish-fail-${c.memberId}`}
                      >
                        {fail.code}: {fail.message}
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ul>

            {progress.total > 0 ? (
              <div
                role="progressbar"
                aria-valuenow={progress.succeeded + progress.failed}
                aria-valuemax={progress.total}
                aria-valuemin={0}
                className="text-sm"
                data-testid="bulk-republish-progress"
              >
                進捗: {progress.succeeded + progress.failed} / {progress.total}
                （成功 {progress.succeeded} / 失敗 {progress.failed}）
              </div>
            ) : null}

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={onClose} disabled={running}>
                閉じる
              </Button>
              <Button
                variant="primary"
                onClick={handleStart}
                disabled={running || selected.size === 0 || done}
                data-testid="bulk-republish-start"
              >
                {running
                  ? "実行中…"
                  : `選択した ${selected.size} 件を公開状態に戻す`}
              </Button>
            </div>
          </>
        )}
      </div>
    </Drawer>
  );
}
