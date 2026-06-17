"use client";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type {
  DismissIdentityConflictResponse,
  IdentityConflictRow as Row,
  MergeIdentityResponse,
} from "@ubm-hyogo/shared";
import { useAdminMutation } from "../../features/admin/hooks";
import { FetchAuthedError } from "../../lib/fetch/errors";
import {
  matchedFieldLabel,
  RECORD_ROLE_LABELS,
} from "../../features/admin/identity-conflicts/identityConflictGlossary";
import { browserWindow } from "../../lib/is-browser";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Textarea } from "../ui/Textarea";
import { useIdentityConflictAnnounce } from "./IdentityConflictAnnouncer";
import {
  announcementFor,
  type IdentityConflictAction,
} from "./identityConflictAnnouncements";

const EXIT_ANIMATION_MS = 200;
const EXIT_FALLBACK_BUFFER_MS = 50;

const prefersReducedMotion = () =>
  browserWindow()?.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

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
  const announce = useIdentityConflictAnnounce();
  const [stage, setStage] = useState<"idle" | "merge-confirm" | "merge-final" | "dismiss">("idle");
  const [optimisticMerged, setOptimisticMerged] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [optimisticDismissed, setOptimisticDismissed] = useState(false);
  const [mergeReason, setMergeReason] = useState("");
  const [dismissReason, setDismissReason] = useState("");
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mergeReasonId = `${formId}-merge-reason`;
  const dismissReasonId = `${formId}-dismiss-reason`;
  const mergeErrorId = `${formId}-merge-error`;
  const dismissErrorId = `${formId}-dismiss-error`;
  const hasAnnouncedRef = useRef(false);

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

  const clearExitTimer = useCallback(() => {
    if (!exitTimerRef.current) return;
    clearTimeout(exitTimerRef.current);
    exitTimerRef.current = null;
  }, []);

  const announceOnce = useCallback(
    (action: IdentityConflictAction) => {
      if (hasAnnouncedRef.current) return;
      hasAnnouncedRef.current = true;
      announce(announcementFor(action));
    },
    [announce],
  );

  const finalizeRemoval = useCallback(() => {
    clearExitTimer();
    setOptimisticMerged(true);
  }, [clearExitTimer]);

  useEffect(() => clearExitTimer, [clearExitTimer]);

  const onMerge = () => {
    setIsExiting(true);
    clearExitTimer();
    const delay = prefersReducedMotion()
      ? 0
      : EXIT_ANIMATION_MS + EXIT_FALLBACK_BUFFER_MS;
    exitTimerRef.current = setTimeout(finalizeRemoval, delay);
    void mergeMutation
      .trigger({
        targetMemberId: item.candidateTargetMemberId,
        reason: mergeReason.trim(),
      })
      .then(() => announceOnce("merge"))
      .catch(() => {
        clearExitTimer();
        setIsExiting(false);
        setOptimisticMerged(false);
        hasAnnouncedRef.current = false;
        // error は mergeMutation.error / toast 経由で surface。modal は閉じず、reason を保持する。
      });
  };

  const onDismiss = () => {
    setOptimisticDismissed(true);
    void dismissMutation
      .trigger({ reason: dismissReason.trim() })
      .then(() => announceOnce("dismiss"))
      .catch(() => {
        setOptimisticDismissed(false);
        hasAnnouncedRef.current = false;
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

  if (optimisticMerged || optimisticDismissed) return null;

  return (
    <div
      className={[
        "flex flex-col gap-3 rounded border border-[var(--ubm-color-border-default)] bg-[var(--ubm-color-surface-panel)] p-4",
        "transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none",
        isExiting ? "pointer-events-none scale-[0.99] opacity-0" : "scale-100 opacity-100",
      ].join(" ")}
      data-state={isExiting ? "exiting" : "idle"}
      onTransitionEnd={(event) => {
        if (!isExiting || event.currentTarget !== event.target) return;
        if (event.propertyName !== "opacity" && event.propertyName !== "transform") return;
        finalizeRemoval();
      }}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="text-sm">
          <details className="text-xs text-[var(--ubm-color-text-muted)]">
            <summary className="cursor-pointer">技術情報</summary>
            <span className="font-mono">照合キー: {item.conflictId}</span>
          </details>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge tone="info" outline>
              {RECORD_ROLE_LABELS.source}
            </Badge>
            <span className="font-mono">{item.sourceMemberId}</span>
            <span aria-hidden="true" className="text-[var(--ubm-color-text-muted)]">
              →
            </span>
            <Badge tone="accent" outline>
              {RECORD_ROLE_LABELS.target}
            </Badge>
            <span className="font-mono">{item.candidateTargetMemberId}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[var(--ubm-color-text-muted)]">
            <span>
              メール: <span className="font-mono">{item.responseEmailMasked}</span>
            </span>
            <span>一致した項目: {item.matchedFields.map(matchedFieldLabel).join("、")}</span>
            {item.matchedFields.map((field) => (
              <Badge key={field} tone="default">
                {matchedFieldLabel(field)}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          {stage === "idle" && (
            <>
              <Button variant="ghost" size="sm" onClick={() => setStage("dismiss")}>
                別人として確定
              </Button>
              <Button variant="primary" size="sm" onClick={() => setStage("merge-confirm")}>
                統合する
              </Button>
            </>
          )}
        </div>
      </div>

      {stage === "merge-confirm" && (
        <div className="rounded border border-[var(--ubm-color-warn)] bg-[var(--ubm-color-warn-soft)] p-3 text-sm">
          <p className="mb-2">
            <strong>確認 1/2：</strong>
            この2件を「同じ1人の会員」としてまとめます。登録内容そのものは消えず、表示上のつながりだけを更新します。
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
            <strong>確認 2/2：</strong>
            まとめる理由を記録します（個人情報は自動で伏せられます）。
          </p>
          <label
            htmlFor={mergeReasonId}
            className="mb-1 block text-xs font-medium text-[var(--ubm-color-text-secondary)]"
          >
            まとめる理由
          </label>
          <Textarea
            id={mergeReasonId}
            value={mergeReason}
            onChange={(e) => setMergeReason(e.target.value)}
            aria-invalid={mergeError ? "true" : undefined}
            {...(mergeError ? { describedBy: mergeErrorId } : {})}
            className="mb-2 w-full rounded border p-2 text-sm"
            placeholder="例：本人確認済み／同じ人として統合"
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
              統合を実行
            </Button>
          </div>
        </div>
      )}

      {stage === "dismiss" && (
        <div className="rounded border border-[var(--ubm-color-border-default)] bg-[var(--ubm-color-surface-panel-2)] p-3 text-sm">
          <p className="mb-2">別人として確定します。今後この組み合わせは重複候補に出ません。理由を記載してください。</p>
          <label
            htmlFor={dismissReasonId}
            className="mb-1 block text-xs font-medium text-[var(--ubm-color-text-secondary)]"
          >
            別人と判断した理由
          </label>
          <Textarea
            id={dismissReasonId}
            value={dismissReason}
            onChange={(e) => setDismissReason(e.target.value)}
            aria-invalid={dismissError ? "true" : undefined}
            {...(dismissError ? { describedBy: dismissErrorId } : {})}
            className="mb-2 w-full rounded border p-2 text-sm"
            placeholder="例：同姓同名で別人／別組織と確認済み"
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
