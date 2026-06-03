"use client";
import { useEffect, useId, useRef, useState } from "react";
import type {
  DismissIdentityConflictResponse,
  IdentityConflictRow as Row,
  MergeIdentityResponse,
} from "@ubm-hyogo/shared";
import { useAdminMutation } from "../../features/admin/hooks";
import { FetchAuthedError } from "../../lib/fetch/errors";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Textarea } from "../ui/Textarea";

const errorMessage = (error: Error | null): string | null => {
  if (!error) return null;
  if (!(error instanceof FetchAuthedError)) return error.message;
  if (!error.bodyText) return error.message;
  try {
    const body = JSON.parse(error.bodyText) as { message?: string; error?: string };
    return body.message ?? body.error ?? error.message;
  } catch {
    return error.bodyText;
  }
};

export function IdentityConflictRow({ item }: { item: Row }) {
  const formId = useId();
  const optimisticStatusRef = useRef<HTMLParagraphElement>(null);
  const [stage, setStage] = useState<"idle" | "merge-confirm" | "merge-final" | "dismiss">("idle");
  const [optimisticMerged, setOptimisticMerged] = useState(false);
  const [optimisticDismissed, setOptimisticDismissed] = useState(false);
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

  const mergeError = errorMessage(mergeMutation.error);
  const dismissError = errorMessage(dismissMutation.error);
  const optimisticStatus =
    optimisticDismissed
      ? "別人として確定しました。候補を一覧から非表示にしました。"
      : optimisticMerged
        ? "merge を実行しました。候補を一覧から非表示にしました。"
        : null;

  useEffect(() => {
    if (!optimisticStatus) return;
    optimisticStatusRef.current?.focus();
  }, [optimisticStatus]);

  const onMerge = () => {
    setOptimisticMerged(true);
    void mergeMutation
      .trigger({
        targetMemberId: item.candidateTargetMemberId,
        reason: mergeReason.trim(),
      })
      .catch(() => {
        setOptimisticMerged(false);
        // error は mergeMutation.error / toast 経由で surface。modal は閉じず、reason を保持する。
      });
  };

  const onDismiss = () => {
    setOptimisticDismissed(true);
    void dismissMutation.trigger({ reason: dismissReason.trim() }).catch(() => {
      setOptimisticDismissed(false);
      // 同上: 失敗時に modal を閉じず、reason を保持する。
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

  if (optimisticStatus) {
    return (
      <p
        ref={optimisticStatusRef}
        role="status"
        aria-live="polite"
        tabIndex={-1}
        className="sr-only"
      >
        {optimisticStatus}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded border border-[var(--ubm-color-border-default)] bg-[var(--ubm-color-surface-panel)] p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="text-sm">
          <div className="font-mono text-xs text-[var(--ubm-color-text-muted)]">
            conflict: {item.conflictId}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge tone="info" outline>
              source
            </Badge>
            <span className="font-mono">{item.sourceMemberId}</span>
            <span aria-hidden="true" className="text-[var(--ubm-color-text-muted)]">
              →
            </span>
            <Badge tone="accent" outline>
              target
            </Badge>
            <span className="font-mono">{item.candidateTargetMemberId}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[var(--ubm-color-text-muted)]">
            <span>
              email: <span className="font-mono">{item.responseEmailMasked}</span>
            </span>
            <span>matched: {item.matchedFields.join(", ")}</span>
            {item.matchedFields.map((field) => (
              <Badge key={field} tone="default">
                {field}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          {stage === "idle" && (
            <>
              <Button variant="ghost" size="sm" onClick={() => setStage("dismiss")}>
                別人マーク
              </Button>
              <Button variant="primary" size="sm" onClick={() => setStage("merge-confirm")}>
                merge
              </Button>
            </>
          )}
        </div>
      </div>

      {stage === "merge-confirm" && (
        <div className="rounded border border-[var(--ubm-color-warn)] bg-[var(--ubm-color-warn-soft)] p-3 text-sm">
          <p className="mb-2">
            <strong>確認 1/2:</strong> {item.sourceMemberId} を {item.candidateTargetMemberId} に統合します。
            実体本文は移動せず、canonical 解決テーブルのみ更新します。
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={cancelMerge}>
              キャンセル
            </Button>
            <Button variant="accent" size="sm" onClick={() => setStage("merge-final")}>
              次へ
            </Button>
          </div>
        </div>
      )}

      {stage === "merge-final" && (
        <div className="rounded border border-[var(--ubm-color-danger)] bg-[var(--ubm-color-danger-soft)] p-3 text-sm">
          <p className="mb-2">
            <strong>確認 2/2:</strong> merge 理由を記録します（PII は redaction されます）。
          </p>
          <label
            htmlFor={mergeReasonId}
            className="mb-1 block text-xs font-medium text-[var(--ubm-color-text-secondary)]"
          >
            merge 理由
          </label>
          <Textarea
            id={mergeReasonId}
            value={mergeReason}
            onChange={(e) => setMergeReason(e.target.value)}
            aria-invalid={mergeError ? "true" : undefined}
            {...(mergeError ? { describedBy: mergeErrorId } : {})}
            className="mb-2 w-full rounded border p-2 text-sm"
            placeholder="例: 本人確認済 / 同一人物として統合"
            rows={2}
            maxLength={500}
            disabled={mergeMutation.isLoading}
          />
          {mergeError && (
            <p
              id={mergeErrorId}
              className="mb-2 text-[var(--ubm-color-danger)]"
              role="alert"
              aria-live="polite"
            >
              {mergeError}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={cancelMerge} disabled={mergeMutation.isLoading}>
              キャンセル
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={onMerge}
              loading={mergeMutation.isLoading}
              disabled={mergeMutation.isLoading || mergeReason.trim().length === 0}
            >
              merge 実行
            </Button>
          </div>
        </div>
      )}

      {stage === "dismiss" && (
        <div className="rounded border border-[var(--ubm-color-border-default)] bg-[var(--ubm-color-surface-panel-2)] p-3 text-sm">
          <p className="mb-2">別人として確定します。再検出を抑止します。理由を記載してください。</p>
          <label
            htmlFor={dismissReasonId}
            className="mb-1 block text-xs font-medium text-[var(--ubm-color-text-secondary)]"
          >
            別人マーク理由
          </label>
          <Textarea
            id={dismissReasonId}
            value={dismissReason}
            onChange={(e) => setDismissReason(e.target.value)}
            aria-invalid={dismissError ? "true" : undefined}
            {...(dismissError ? { describedBy: dismissErrorId } : {})}
            className="mb-2 w-full rounded border p-2 text-sm"
            placeholder="例: 同姓同名 / 別組織所属で確認済"
            rows={2}
            maxLength={500}
            disabled={dismissMutation.isLoading}
          />
          {dismissError && (
            <p
              id={dismissErrorId}
              className="mb-2 text-[var(--ubm-color-danger)]"
              role="alert"
              aria-live="polite"
            >
              {dismissError}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={cancelDismiss} disabled={dismissMutation.isLoading}>
              キャンセル
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={onDismiss}
              loading={dismissMutation.isLoading}
              disabled={dismissMutation.isLoading || dismissReason.trim().length === 0}
            >
              別人として確定
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
