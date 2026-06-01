import { AdminPageHeader } from "../../../../src/features/admin/components";
import { safeServerFetch } from "../../../../src/lib/admin/safe-server-fetch";
import type { FormsPipelineSnapshot } from "../../../../src/features/admin/diagnostics/types";
import { FormsPipelineSnapshotSchema } from "../../../../src/features/admin/diagnostics/types";
import { AdminSectionErrorClient } from "../../../../src/features/admin/components/_shared";
import { BackfillPublishStatePanel } from "../../../../src/features/admin/components/_sync/BackfillPublishStatePanel.client";
import { ManualFormResyncPanel } from "../../../../src/features/admin/components/_sync/ManualFormResyncPanel.client";

export const dynamic = "force-dynamic";

const flagRows = (snapshot: FormsPipelineSnapshot) => [
  {
    id: "H1",
    label: "ingest",
    active: snapshot.hypothesisFlags.H1_ingestNeverRanOrAllErrors,
    value: `${snapshot.counts.formResponses} responses`,
  },
  {
    id: "H2",
    label: "identity",
    active: snapshot.hypothesisFlags.H2_identityMismatchSuspected,
    value: `${snapshot.identityHealth.membersWithoutIdentity} missing`,
  },
  {
    id: "H3",
    label: "visibility",
    active: snapshot.hypothesisFlags.H3_allHiddenByPublishState,
    value: `${snapshot.publicVisibility.visibleOnPublicDirectory} visible`,
  },
  {
    id: "H4",
    label: "alias",
    active: snapshot.hypothesisFlags.H4_aliasPendingNonZero,
    value: `${snapshot.aliasPendingCount} queued`,
  },
];

export default async function AdminSyncStatusPage() {
  const result = await safeServerFetch<unknown>("/admin/diagnostics/forms-pipeline");
  const parsed = result.ok
    ? FormsPipelineSnapshotSchema.safeParse(result.data)
    : null;

  return (
    <section aria-labelledby="sync-status-h" className="flex flex-col gap-4">
      <AdminPageHeader
        title="Google Form 反映診断"
        description="ingest / identity / visibility / alias の切り分け"
        breadcrumbs={[{ label: "管理", href: "/admin" }, { label: "同期診断" }]}
      />
      <h1 id="sync-status-h" className="sr-only">
        Google Form 反映診断
      </h1>
      {!result.ok ? (
        <AdminSectionErrorClient
          sectionLabel="Google Form 反映診断"
          code={result.error.code}
          message={result.error.message}
        />
      ) : !parsed?.success ? (
        <AdminSectionErrorClient
          sectionLabel="Google Form 反映診断"
          code="UBM-SYNC-DIAG-SCHEMA"
          message="診断レスポンスの形式が一致しません"
        />
      ) : (
        <SyncStatusView snapshot={parsed.data} />
      )}
    </section>
  );
}

function SyncStatusView({ snapshot }: { readonly snapshot: FormsPipelineSnapshot }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 md:grid-cols-4">
        {flagRows(snapshot).map((row) => (
          <dl
            key={row.id}
            data-active={row.active || undefined}
            className="rounded border border-[var(--ubm-color-border-default)] bg-[var(--ubm-color-surface)] p-3"
          >
            <dt className="text-xs font-semibold text-[var(--ubm-color-text-muted)]">
              {row.id} {row.label}
            </dt>
            <dd className="mt-2 flex items-baseline justify-between gap-2">
              <span className="text-lg font-semibold text-[var(--ubm-color-text-primary)]">
                {row.active ? "active" : "clear"}
              </span>
              <span className="text-xs text-[var(--ubm-color-text-muted)]">
                {row.value}
              </span>
            </dd>
          </dl>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="border-t border-[var(--ubm-color-border-default)] pt-4">
          <h2 className="text-sm font-semibold text-[var(--ubm-color-text-primary)]">
            pipeline counts
          </h2>
          <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <dt className="text-[var(--ubm-color-text-muted)]">responses</dt>
            <dd>{snapshot.counts.formResponses}</dd>
            <dt className="text-[var(--ubm-color-text-muted)]">fields</dt>
            <dd>{snapshot.counts.responseFields}</dd>
            <dt className="text-[var(--ubm-color-text-muted)]">members</dt>
            <dd>{snapshot.counts.members}</dd>
            <dt className="text-[var(--ubm-color-text-muted)]">identities</dt>
            <dd>{snapshot.counts.memberIdentities}</dd>
          </dl>
        </section>
        <section className="border-t border-[var(--ubm-color-border-default)] pt-4">
          <h2 className="text-sm font-semibold text-[var(--ubm-color-text-primary)]">
            secrets readiness
          </h2>
          <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
            {Object.entries(snapshot.secretsReadiness).map(([key, value]) => (
              <div key={key} className="contents">
                <dt className="text-[var(--ubm-color-text-muted)]">{key}</dt>
                <dd>{value ? "ready" : "missing"}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <BackfillPublishStatePanel />
        <ManualFormResyncPanel />
      </div>
    </div>
  );
}
