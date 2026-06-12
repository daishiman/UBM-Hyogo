"use client";

import { useEffect, useState } from "react";
import { fetchMemberDiagnosis } from "../../diagnostics/api";
import type { MemberDiagnosis } from "../../diagnostics/types";
import {
  MEMBER_DIAGNOSTICS_FIELD_LABELS,
  MEMBER_SYSTEM_SECTION_LABELS,
  formatBooleanJa,
} from "./memberSystemFieldGlossary";

export interface MemberDiagnosticsPanelProps {
  readonly memberId: string;
}

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
      <h3 className="text-xs font-semibold text-[var(--ubm-color-text-muted)]">
        {MEMBER_SYSTEM_SECTION_LABELS.diagnostics}
      </h3>
      <dl className="mt-2 grid gap-2 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-[var(--ubm-color-text-muted)]">
            {MEMBER_DIAGNOSTICS_FIELD_LABELS.matchedResponse}
            <span className="ml-1 font-mono text-[10px] opacity-60">matched response</span>
          </dt>
          <dd className="font-mono">
            {data.identityMatches.matchedFormResponseId ?? "none"}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-[var(--ubm-color-text-muted)]">
            {MEMBER_DIAGNOSTICS_FIELD_LABELS.responseFields}
            <span className="ml-1 font-mono text-[10px] opacity-60">response fields</span>
          </dt>
          <dd>
            {data.responseFieldCount} / {data.expectedFieldCount}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-[var(--ubm-color-text-muted)]">
            {MEMBER_DIAGNOSTICS_FIELD_LABELS.publicVisible}
            <span className="ml-1 font-mono text-[10px] opacity-60">public visible</span>
          </dt>
          <dd>{formatBooleanJa(data.publishState.visibleOnPublicDirectory)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-[var(--ubm-color-text-muted)]">
            {MEMBER_DIAGNOSTICS_FIELD_LABELS.h3Hidden}
            <span className="ml-1 font-mono text-[10px] opacity-60">H3 hidden</span>
          </dt>
          <dd>{formatBooleanJa(data.hypothesisFlags.H3_hiddenByConsentOrPublish)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-[var(--ubm-color-text-muted)]">
            {MEMBER_DIAGNOSTICS_FIELD_LABELS.h4MissingFields}
            <span className="ml-1 font-mono text-[10px] opacity-60">H4 missing fields</span>
          </dt>
          <dd>{formatBooleanJa(data.hypothesisFlags.H4_missingFieldsNonEmpty)}</dd>
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
