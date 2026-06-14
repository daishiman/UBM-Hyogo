"use client";
// Issue #837: schema alias bulk rollback confirmation modal.

import type {
  BulkRollbackRowState,
  BulkRollbackSummary,
} from "./hooks/useSchemaDiffBulkRollbackSelection";
import { Modal } from "../ui/Modal";

export interface SchemaDiffBulkRollbackModalProps {
  open: boolean;
  rows: BulkRollbackRowState[];
  summary: BulkRollbackSummary | null;
  isSubmitting: boolean;
  onSubmit: () => void;
  onClose: () => void;
}

const STATUS_LABEL: Record<BulkRollbackRowState["submitStatus"], string> = {
  idle: "未送信",
  pending: "取り消し中",
  success: "成功",
  error: "失敗",
};

const summaryKind = (summary: BulkRollbackSummary | null) => {
  if (!summary) return "pending";
  if (summary.succeeded.length > 0 && summary.failed.length === 0) return "all-success";
  if (summary.succeeded.length > 0 && summary.failed.length > 0) return "partial";
  return "all-failed";
};

export function SchemaDiffBulkRollbackModal({
  open,
  rows,
  summary,
  isSubmitting,
  onSubmit,
  onClose,
}: SchemaDiffBulkRollbackModalProps) {
  if (!open) return null;
  const affectedTotal = rows.reduce(
    (sum, row) => sum + (row.impact?.affectedResponseCount ?? 0),
    0,
  );
  const hasRecompute = rows.some((row) => row.impact?.recomputeRequired);
  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="まとめて取り消しの確認">
      <div data-testid="bulk-rollback-modal">
        <p>選択された {rows.length} 件の対応づけをまとめて取り消します。</p>
        <dl>
          <dt>影響応答件数（既知分）</dt>
          <dd data-role="bulk-rollback-affected-total">{affectedTotal} 件</dd>
          <dt>再集計要否</dt>
          <dd>{hasRecompute ? "必要な行あり" : "不要または未確定"}</dd>
        </dl>
        {summary && (
          <p
            role="status"
            data-role="bulk-rollback-summary"
            data-summary-kind={summaryKind(summary)}
          >
            成功 {summary.succeeded.length} 件 / 失敗 {summary.failed.length} 件
          </p>
        )}
        <table>
          <thead>
            <tr>
              <th scope="col">表示名</th>
              <th scope="col">項目キー</th>
              <th scope="col">対応づけ日時</th>
              <th scope="col">状態</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isError = row.submitStatus === "error";
              return (
                <tr key={row.aliasId} data-row-status={row.submitStatus}>
                  <td>{row.aliasLabel}</td>
                  <td>
                    <code>{row.stableKey}</code>
                  </td>
                  <td>
                    <time dateTime={row.resolvedAt}>{row.resolvedAt}</time>
                  </td>
                  <td>
                    <span data-status-badge={row.submitStatus}>
                      {STATUS_LABEL[row.submitStatus]}
                    </span>
                    {isError && row.errorMessage && (
                      <p role="alert" data-row-error={row.aliasId}>
                        {row.errorMessage}
                      </p>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div>
          <button type="button" onClick={onSubmit} disabled={isSubmitting || rows.length === 0}>
            {isSubmitting ? "取り消し中..." : "一括で取り消す"}
          </button>
          <button type="button" onClick={handleClose} disabled={isSubmitting}>
            キャンセル
          </button>
        </div>
      </div>
    </Modal>
  );
}
