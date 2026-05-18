"use client";
// Issue #776: schema alias bulk resolve — batch confirm modal。
// 既存の Modal primitive (focus trap / Esc close 内蔵) を再利用する。
// design token は OKLch (apps/web/src/styles/tokens.css) のみ使用し、HEX 直書きは行わない。

import type { BulkRowState } from "./hooks/useSchemaDiffBulkSelection";
import { Modal } from "../ui/Modal";
import {
  isStableKeyValid,
  STABLE_KEY_VALIDATION_MESSAGE,
} from "./schemaAliasValidation";

export interface SchemaDiffBulkResolveModalProps {
  open: boolean;
  rows: BulkRowState[];
  isSubmitting: boolean;
  onUpdateStableKey: (diffId: string, value: string) => void;
  onApplyRecommendation: (diffId: string) => void;
  onApplyAllRecommendations: () => void;
  onSubmit: () => void;
  onClose: () => void;
}

const STATUS_LABEL: Record<BulkRowState["submitStatus"], string> = {
  idle: "未送信",
  pending: "送信中",
  success: "成功",
  retryable: "再試行可能",
  error: "失敗",
};

export function SchemaDiffBulkResolveModal({
  open,
  rows,
  isSubmitting,
  onUpdateStableKey,
  onApplyRecommendation,
  onApplyAllRecommendations,
  onSubmit,
  onClose,
}: SchemaDiffBulkResolveModalProps) {
  if (!open) return null;
  const invalidDiffIds = new Set(
    rows.filter((r) => !isStableKeyValid(r.stableKey)).map((r) => r.diffId),
  );
  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };
  return (
    <Modal open={open} onClose={handleClose} title="Bulk Resolve 確認">
      <div data-testid="bulk-resolve-modal">
        <p>
          選択された {rows.length} 件の stableKey 割当を一括で実行します。
        </p>
        <div>
          <button
            type="button"
            onClick={onApplyAllRecommendations}
            disabled={isSubmitting}
          >
            全行に推奨を適用
          </button>
        </div>
        <table>
          <thead>
            <tr>
              <th scope="col">questionId</th>
              <th scope="col">stableKey</th>
              <th scope="col">推奨</th>
              <th scope="col">状態</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const isError =
                r.submitStatus === "error" || r.submitStatus === "retryable";
              return (
                <tr key={r.diffId} data-row-status={r.submitStatus}>
                  <td>
                    <code>{r.questionId}</code>
                  </td>
                  <td>
                    <label>
                      <span className="visually-hidden">
                        stableKey for {r.questionId}
                      </span>
                      <input
                        type="text"
                        value={r.stableKey}
                        onChange={(e) =>
                          onUpdateStableKey(r.diffId, e.target.value)
                        }
                        aria-label={`stableKey for ${r.questionId}`}
                        aria-invalid={invalidDiffIds.has(r.diffId)}
                        aria-describedby={
                          invalidDiffIds.has(r.diffId)
                            ? `bulk-stablekey-error-${r.diffId}`
                            : undefined
                        }
                        disabled={isSubmitting}
                      />
                    </label>
                    {invalidDiffIds.has(r.diffId) && (
                      <p
                        id={`bulk-stablekey-error-${r.diffId}`}
                        role="alert"
                        data-row-validation-error={r.diffId}
                      >
                        {STABLE_KEY_VALIDATION_MESSAGE}
                      </p>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => onApplyRecommendation(r.diffId)}
                      disabled={isSubmitting || !r.suggestedStableKey}
                    >
                      推奨採用
                    </button>
                    {r.suggestedStableKey && (
                      <code>{r.suggestedStableKey}</code>
                    )}
                  </td>
                  <td>
                    <span data-status-badge={r.submitStatus}>
                      {STATUS_LABEL[r.submitStatus]}
                    </span>
                    {isError && r.errorMessage && (
                      <p role="alert" data-row-error={r.diffId}>
                        {r.errorMessage}
                      </p>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting || rows.length === 0 || invalidDiffIds.size > 0}
          >
            {isSubmitting ? "送信中..." : "確定"}
          </button>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            キャンセル
          </button>
        </div>
      </div>
    </Modal>
  );
}
