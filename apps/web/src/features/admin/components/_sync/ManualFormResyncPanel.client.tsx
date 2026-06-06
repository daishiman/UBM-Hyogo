"use client";

import { useState } from "react";

import { Button } from "../../../../components/ui/Button";
import { FetchAuthedError } from "../../hooks/useAdminMutation";
import {
  SYNC_RESPONSES_PATH,
  SyncPreviewRunResponseSchema,
  SyncRunResponseSchema,
  type SyncPreviewResult,
  type SyncResult,
} from "../../diagnostics/manual-sync";
import { useAdminMutation } from "../../hooks/useAdminMutation";
import { AdminSectionCard } from "../_shared";

export interface ManualFormResyncPanelProps {
  readonly onSynced?: (result: SyncResult) => void;
}

function parseInProgress(error: Error | null): string | null {
  if (!(error instanceof FetchAuthedError) || error.status !== 409) {
    return null;
  }
  try {
    const parsed = SyncRunResponseSchema.safeParse(JSON.parse(error.bodyText));
    if (parsed.success && parsed.data.result.status === "skipped") {
      return `他の sync が実行中です (${parsed.data.result.jobId})`;
    }
  } catch {
    // Fall through to generic 409 message.
  }
  return "他の sync が実行中です";
}

function resultRows(result: SyncResult) {
  return [
    ["status", result.status],
    ["jobId", result.jobId],
    ["processedCount", result.processedCount],
    ["writeCount", result.writeCount],
    ["cursor", result.cursor ?? "-"],
    ["durationMs", result.durationMs ?? "-"],
  ] as const;
}

export function ManualFormResyncPanel({ onSynced }: ManualFormResyncPanelProps) {
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);
  const [previewResult, setPreviewResult] = useState<SyncPreviewResult | null>(
    null,
  );
  const [mode, setMode] = useState<"run" | "backfill" | "preview" | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  // hook 宣言順は run / backfill / preview（テストの mock 振り分け順と一致・正本）。
  const runMutation = useAdminMutation<unknown>(SYNC_RESPONSES_PATH, "POST", {
    refreshOnSuccess: false,
    timeoutMs: 60000,
    successMessage: () => "",
  });
  const backfillMutation = useAdminMutation<unknown>(SYNC_RESPONSES_PATH, "POST", {
    refreshOnSuccess: false,
    timeoutMs: 60000,
    successMessage: () => "",
  });
  const previewMutation = useAdminMutation<unknown>(SYNC_RESPONSES_PATH, "POST", {
    refreshOnSuccess: false,
    timeoutMs: 60000,
    successMessage: () => "",
  });

  const busy =
    runMutation.isLoading ||
    backfillMutation.isLoading ||
    previewMutation.isLoading;
  const inProgress =
    parseInProgress(runMutation.error) ?? parseInProgress(backfillMutation.error);
  // 全件 backfill は preview 後（かつ stale 化していない）のみ enable（AC-1 / DD4）。
  const canBackfill = previewResult !== null && mode === "preview";

  const applyResponse = (
    raw: unknown,
    nextMode: "run" | "backfill",
  ): SyncResult | null => {
    const parsed = SyncRunResponseSchema.safeParse(raw);
    if (!parsed.success) {
      setParseError("sync result schema mismatch");
      setLastResult(null);
      setMode(null);
      return null;
    }
    setParseError(null);
    setLastResult(parsed.data.result);
    setMode(nextMode);
    onSynced?.(parsed.data.result);
    return parsed.data.result;
  };

  const runSync = async () => {
    setParseError(null);
    setPreviewResult(null); // preview 無効化（stale 化）
    const raw = await runMutation.trigger({}, `${SYNC_RESPONSES_PATH}?fullSync=false`);
    applyResponse(raw, "run");
  };

  const runPreview = async () => {
    setParseError(null);
    const raw = await previewMutation.trigger(
      {},
      `${SYNC_RESPONSES_PATH}?dryRun=true&fullSync=true`,
    );
    const parsed = SyncPreviewRunResponseSchema.safeParse(raw);
    if (!parsed.success) {
      setPreviewResult(null);
      setMode(null);
      setParseError("件数取得不可: preview result schema mismatch");
      return;
    }
    setPreviewResult(parsed.data.preview);
    setMode("preview");
  };

  const runBackfill = async () => {
    const count = previewResult?.responseCount ?? null;
    const msg =
      count !== null
        ? `全 ${count} 件の回答を再取込します（推定 ${previewResult!.estimatedWrites} write）。実行しますか?`
        : "Google Forms 回答を fullSync=true で再取込します。実行しますか?";
    if (!globalThis.confirm(msg)) {
      return; // AC-4: cancel で early return（不実行）
    }
    setParseError(null);
    setPreviewResult(null); // preview consume（再 preview 必須）
    const raw = await backfillMutation.trigger({}, `${SYNC_RESPONSES_PATH}?fullSync=true`);
    applyResponse(raw, "backfill");
  };

  return (
    <AdminSectionCard
      title="フォーム回答の再取込"
      description="差分 sync を既定操作にし、全件 backfill は影響件数を確認してから実行します。"
      density="compact"
    >
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="primary"
          disabled={busy}
          loading={runMutation.isLoading}
          onClick={() => void runSync().catch(() => {})}
          data-testid="manual-sync-run"
        >
          差分 sync
        </Button>
        <Button
          type="button"
          variant="soft"
          disabled={busy}
          loading={previewMutation.isLoading}
          onClick={() => void runPreview().catch(() => {})}
          data-testid="manual-sync-backfill-preview"
        >
          影響件数を確認
        </Button>
        <Button
          type="button"
          variant="danger"
          disabled={busy || !canBackfill}
          loading={backfillMutation.isLoading}
          onClick={() => void runBackfill().catch(() => {})}
          data-testid="manual-sync-backfill"
        >
          全件 backfill
        </Button>
      </div>
      {parseError ? (
        <p role="alert" className="mt-3 text-sm text-[var(--ubm-color-danger)]">
          {parseError}
        </p>
      ) : inProgress ? (
        <p role="status" className="mt-3 text-sm text-[var(--ubm-color-text-secondary)]">
          {inProgress}
        </p>
      ) : runMutation.error || backfillMutation.error || previewMutation.error ? (
        <p role="alert" className="mt-3 text-sm text-[var(--ubm-color-danger)]">
          {(runMutation.error ?? backfillMutation.error ?? previewMutation.error)?.message}
        </p>
      ) : null}
      {mode === "preview" && previewResult ? (
        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
          <dt className="text-[var(--ubm-color-text-muted)]">影響件数（実数）</dt>
          <dd data-testid="manual-sync-preview-response-count">
            {previewResult.responseCount}
          </dd>
          <dt className="text-[var(--ubm-color-text-muted)]">推定 write 数</dt>
          <dd data-testid="manual-sync-preview-estimated-writes">
            {previewResult.estimatedWrites}
          </dd>
          <dt className="text-[var(--ubm-color-text-muted)]">pagesScanned</dt>
          <dd>{previewResult.pagesScanned}</dd>
          {previewResult.capped ? (
            <>
              <dt className="text-[var(--ubm-color-text-muted)]">注記</dt>
              <dd className="text-[var(--ubm-color-text-secondary)]">
                上限到達: 一部のみ集計
              </dd>
            </>
          ) : null}
        </dl>
      ) : null}
      {lastResult ? (
        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
          <dt className="text-[var(--ubm-color-text-muted)]">mode</dt>
          <dd>{mode}</dd>
          {resultRows(lastResult).map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-[var(--ubm-color-text-muted)]">{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
          {lastResult.skippedReason ? (
            <>
              <dt className="text-[var(--ubm-color-text-muted)]">skippedReason</dt>
              <dd>{lastResult.skippedReason}</dd>
            </>
          ) : null}
        </dl>
      ) : null}
    </AdminSectionCard>
  );
}
