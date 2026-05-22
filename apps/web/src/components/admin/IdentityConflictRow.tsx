"use client";
import { useId, useState } from "react";
import type {
  DismissIdentityConflictResponse,
  IdentityConflictRow as Row,
  MergeIdentityResponse,
} from "@ubm-hyogo/shared";
import { useAdminMutation } from "../../features/admin/hooks";

export function IdentityConflictRow({ item }: { item: Row }) {
  const formId = useId();
  const [stage, setStage] = useState<"idle" | "merge-confirm" | "merge-final" | "dismiss">("idle");
  const [mergeReason, setMergeReason] = useState("");
  const [dismissReason, setDismissReason] = useState("");
  const mergeReasonId = `${formId}-merge-reason`;
  const dismissReasonId = `${formId}-dismiss-reason`;
  const mergeErrorId = `${formId}-merge-error`;
  const dismissErrorId = `${formId}-dismiss-error`;

  const mergeMutation = useAdminMutation<MergeIdentityResponse>(
    `/api/admin/identity-conflicts/${encodeURIComponent(item.conflictId)}/merge`,
    "POST",
    {
      successMessage: "✓ 統合しました",
      onSuccess: () => {
        setStage("idle");
        setMergeReason("");
      },
    },
  );

  const dismissMutation = useAdminMutation<DismissIdentityConflictResponse>(
    `/api/admin/identity-conflicts/${encodeURIComponent(item.conflictId)}/dismiss`,
    "POST",
    {
      successMessage: "✓ 別人として確定しました",
      onSuccess: () => {
        setStage("idle");
        setDismissReason("");
      },
    },
  );

  const mergeError = mergeMutation.error?.message ?? null;
  const dismissError = dismissMutation.error?.message ?? null;

  const onMerge = () => {
    void mergeMutation
      .trigger({
        targetMemberId: item.candidateTargetMemberId,
        reason: mergeReason.trim(),
      })
      .catch(() => {
        // error は mergeMutation.error / toast 経由で surface。modal は閉じず、reason を保持する。
      });
  };

  const onDismiss = () => {
    void dismissMutation.trigger({ reason: dismissReason.trim() }).catch(() => {
      // 同上: 失敗時に modal を閉じない。
    });
  };

  const cancelMerge = () => {
    setStage("idle");
    setMergeReason("");
  };
  const cancelDismiss = () => {
    setStage("idle");
    setDismissReason("");
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm">
          <div className="font-mono text-xs text-zinc-500">conflict: {item.conflictId}</div>
          <div>
            <span className="text-zinc-500">source:</span> <span className="font-mono">{item.sourceMemberId}</span>
            <span className="ml-2 text-zinc-500">→ target:</span>{" "}
            <span className="font-mono">{item.candidateTargetMemberId}</span>
          </div>
          <div className="text-zinc-500">
            email: <span className="font-mono">{item.responseEmailMasked}</span> / matched:{" "}
            {item.matchedFields.join(", ")}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          {stage === "idle" && (
            <>
              <button
                type="button"
                className="rounded-md border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-50"
                onClick={() => setStage("dismiss")}
              >
                別人マーク
              </button>
              <button
                type="button"
                className="rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                onClick={() => setStage("merge-confirm")}
              >
                merge
              </button>
            </>
          )}
        </div>
      </div>

      {stage === "merge-confirm" && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm">
          <p className="mb-2">
            <strong>確認 1/2:</strong> {item.sourceMemberId} を {item.candidateTargetMemberId} に統合します。
            実体本文は移動せず、canonical 解決テーブルのみ更新します。
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="rounded-md border border-zinc-300 px-3 py-1"
              onClick={cancelMerge}
            >
              キャンセル
            </button>
            <button
              type="button"
              className="rounded-md bg-amber-600 px-3 py-1 text-white"
              onClick={() => setStage("merge-final")}
            >
              次へ
            </button>
          </div>
        </div>
      )}

      {stage === "merge-final" && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm">
          <p className="mb-2">
            <strong>確認 2/2:</strong> merge 理由を記録します（PII は redaction されます）。
          </p>
          <label htmlFor={mergeReasonId} className="mb-1 block text-xs font-medium text-zinc-700">
            merge 理由
          </label>
          <textarea
            id={mergeReasonId}
            value={mergeReason}
            onChange={(e) => setMergeReason(e.target.value)}
            aria-invalid={mergeError ? "true" : undefined}
            aria-describedby={mergeError ? mergeErrorId : undefined}
            className="mb-2 w-full rounded-md border border-zinc-300 p-2 text-sm"
            placeholder="例: 本人確認済 / 同一人物として統合"
            rows={2}
            maxLength={500}
            disabled={mergeMutation.isLoading}
          />
          {mergeError && (
            <p
              id={mergeErrorId}
              className="mb-2 text-red-600"
              role="alert"
              aria-live="polite"
            >
              {mergeError}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="rounded-md border border-zinc-300 px-3 py-1"
              onClick={cancelMerge}
              disabled={mergeMutation.isLoading}
            >
              キャンセル
            </button>
            <button
              type="button"
              className="rounded-md bg-red-600 px-3 py-1 text-white disabled:opacity-50"
              onClick={onMerge}
              disabled={mergeMutation.isLoading || mergeReason.trim().length === 0}
            >
              merge 実行
            </button>
          </div>
        </div>
      )}

      {stage === "dismiss" && (
        <div className="rounded-md border border-zinc-300 bg-zinc-50 p-3 text-sm">
          <p className="mb-2">別人として確定します。再検出を抑止します。理由を記載してください。</p>
          <label htmlFor={dismissReasonId} className="mb-1 block text-xs font-medium text-zinc-700">
            別人マーク理由
          </label>
          <textarea
            id={dismissReasonId}
            value={dismissReason}
            onChange={(e) => setDismissReason(e.target.value)}
            aria-invalid={dismissError ? "true" : undefined}
            aria-describedby={dismissError ? dismissErrorId : undefined}
            className="mb-2 w-full rounded-md border border-zinc-300 p-2 text-sm"
            placeholder="例: 同姓同名 / 別組織所属で確認済"
            rows={2}
            maxLength={500}
            disabled={dismissMutation.isLoading}
          />
          {dismissError && (
            <p
              id={dismissErrorId}
              className="mb-2 text-red-600"
              role="alert"
              aria-live="polite"
            >
              {dismissError}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="rounded-md border border-zinc-300 px-3 py-1"
              onClick={cancelDismiss}
              disabled={dismissMutation.isLoading}
            >
              キャンセル
            </button>
            <button
              type="button"
              className="rounded-md bg-zinc-700 px-3 py-1 text-white disabled:opacity-50"
              onClick={onDismiss}
              disabled={dismissMutation.isLoading || dismissReason.trim().length === 0}
            >
              別人として確定
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
