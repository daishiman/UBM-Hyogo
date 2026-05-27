"use client";

import { useEffect, useState } from "react";
import { fetchMemberDiagnosis } from "../../diagnostics/api";
import type { MemberDiagnosis } from "../../diagnostics/types";

export interface MemberDiagnosticsPanelProps {
  readonly memberId: string;
}

const boolLabel = (value: boolean): string => (value ? "yes" : "no");

export function MemberDiagnosticsPanel({
  memberId,
}: MemberDiagnosticsPanelProps) {
  const [data, setData] = useState<MemberDiagnosis | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);
    fetchMemberDiagnosis(memberId)
      .then((next) => {
        if (!cancelled) setData(next);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "fetch failed");
      });
    return () => {
      cancelled = true;
    };
  }, [memberId]);

  if (error) {
    return (
      <p role="alert" className="text-sm text-[var(--ubm-color-danger)]">
        診断の読み込み失敗: {error}
      </p>
    );
  }
  if (!data) {
    return (
      <p role="status" className="text-sm text-[var(--ubm-color-text-muted)]">
        診断を読み込み中...
      </p>
    );
  }

  return (
    <section className="border-t border-[var(--ubm-color-border-default)] pt-4">
      <h3 className="text-xs font-semibold uppercase text-[var(--ubm-color-text-muted)]">
        diagnostics
      </h3>
      <dl className="mt-2 grid gap-2 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-[var(--ubm-color-text-muted)]">matched response</dt>
          <dd className="font-mono">
            {data.identityMatches.matchedFormResponseId ?? "none"}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-[var(--ubm-color-text-muted)]">response fields</dt>
          <dd>
            {data.responseFieldCount} / {data.expectedFieldCount}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-[var(--ubm-color-text-muted)]">public visible</dt>
          <dd>{boolLabel(data.publishState.visibleOnPublicDirectory)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-[var(--ubm-color-text-muted)]">H3 hidden</dt>
          <dd>{boolLabel(data.hypothesisFlags.H3_hiddenByConsentOrPublish)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-[var(--ubm-color-text-muted)]">H4 missing fields</dt>
          <dd>{boolLabel(data.hypothesisFlags.H4_missingFieldsNonEmpty)}</dd>
        </div>
      </dl>
      {data.missingFieldKeys.length > 0 ? (
        <p className="mt-2 break-words text-xs text-[var(--ubm-color-text-muted)]">
          missing: {data.missingFieldKeys.slice(0, 8).join(", ")}
        </p>
      ) : null}
    </section>
  );
}
