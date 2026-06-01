"use client";

import { useState } from "react";

import { Button } from "../../../../components/ui/Button";
import { FetchAuthedError } from "../../hooks/useAdminMutation";
import {
  SYNC_RESPONSES_PATH,
  SyncRunResponseSchema,
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
  ] as const;
}

export function ManualFormResyncPanel({ onSynced }: ManualFormResyncPanelProps) {
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);
  const [mode, setMode] = useState<"run" | "backfill" | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

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

  const busy = runMutation.isLoading || backfillMutation.isLoading;
  const inProgress =
    parseInProgress(runMutation.error) ?? parseInProgress(backfillMutation.error);

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
    const raw = await runMutation.trigger({}, `${SYNC_RESPONSES_PATH}?fullSync=false`);
    applyResponse(raw, "run");
  };

  const runBackfill = async () => {
    if (!globalThis.confirm("Google Forms 回答を fullSync=true で再取込します。実行しますか?")) {
      return;
    }
    setParseError(null);
    const raw = await backfillMutation.trigger({}, `${SYNC_RESPONSES_PATH}?fullSync=true`);
    applyResponse(raw, "backfill");
  };

  return (
    <AdminSectionCard
      title="フォーム回答の再取込"
      description="差分 sync を既定操作にし、全件 backfill は確認後に実行します。"
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
          variant="danger"
          disabled={busy}
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
      ) : runMutation.error || backfillMutation.error ? (
        <p role="alert" className="mt-3 text-sm text-[var(--ubm-color-danger)]">
          {(runMutation.error ?? backfillMutation.error)?.message}
        </p>
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
