"use client";

import { useState } from "react";

import { Button } from "../../../../components/ui/Button";
import {
  BACKFILL_PUBLISH_STATE_PATH,
  BackfillResultSchema,
  type BackfillResult,
} from "../../diagnostics/backfill";
import { useAdminMutation } from "../../hooks/useAdminMutation";
import { AdminSectionCard } from "../_shared";

export interface BackfillPublishStatePanelProps {
  readonly onApplied?: (result: BackfillResult) => void;
}

function resultRows(result: BackfillResult) {
  return [
    ["scanned", result.scanned],
    ["candidates", result.candidates],
    ["applied", result.applied],
    ["skipped.alreadyPublic", result.skipped.alreadyPublic],
    ["skipped.adminExplicit", result.skipped.adminExplicit],
    ["skipped.consentNotMet", result.skipped.consentNotMet],
    ["skipped.deleted", result.skipped.deleted],
  ] as const;
}

export function BackfillPublishStatePanel({
  onApplied,
}: BackfillPublishStatePanelProps) {
  const [lastResult, setLastResult] = useState<BackfillResult | null>(null);
  const [mode, setMode] = useState<"dryRun" | "apply" | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const mutation = useAdminMutation<unknown>(
    BACKFILL_PUBLISH_STATE_PATH,
    "POST",
    {
      refreshOnSuccess: false,
      successMessage: () => "",
    },
  );

  const canApply =
    lastResult !== null && mode === "dryRun" && lastResult.dryRun && lastResult.candidates > 0;

  const run = async (nextMode: "dryRun" | "apply") => {
    if (
      nextMode === "apply" &&
      !globalThis.confirm("直近の dry-run 候補を public に昇格します。実行しますか?")
    ) {
      return;
    }
    setParseError(null);
    const dryRun = nextMode === "dryRun";
    const raw = await mutation.trigger(
      {},
      `${BACKFILL_PUBLISH_STATE_PATH}?dryRun=${String(dryRun)}`,
    );
    const parsed = BackfillResultSchema.safeParse(raw);
    if (!parsed.success) {
      setLastResult(null);
      setMode(null);
      setParseError("backfill result schema mismatch");
      return;
    }
    setLastResult(parsed.data);
    setMode(nextMode);
    if (!dryRun) onApplied?.(parsed.data);
  };

  return (
    <AdminSectionCard
      title="公開状態 backfill"
      description="公開同意済みで member_only に残っている会員を確認し、必要な場合だけ public へ昇格します。"
      density="compact"
    >
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="soft"
          disabled={mutation.isLoading}
          loading={mutation.isLoading && mode !== "apply"}
          onClick={() => void run("dryRun").catch(() => {})}
          data-testid="backfill-dry-run"
        >
          dry-run
        </Button>
        <Button
          type="button"
          variant="danger"
          disabled={mutation.isLoading || !canApply}
          loading={mutation.isLoading && mode === "apply"}
          onClick={() => void run("apply").catch(() => {})}
          data-testid="backfill-apply"
        >
          apply
        </Button>
      </div>
      {parseError ? (
        <p role="alert" className="mt-3 text-sm text-[var(--ubm-color-danger)]">
          {parseError}
        </p>
      ) : mutation.error ? (
        <p role="alert" className="mt-3 text-sm text-[var(--ubm-color-danger)]">
          {mutation.error.message}
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
        </dl>
      ) : null}
    </AdminSectionCard>
  );
}
