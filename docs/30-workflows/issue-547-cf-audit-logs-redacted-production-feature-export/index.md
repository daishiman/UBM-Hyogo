# Task Spec: Issue #547 - Cloudflare Audit Logs Redacted Production Feature Export

[実装区分: 実装仕様書]

判定根拠: Issue #547 は D1 `cf_audit_log` の raw source store から、ML 学習・評価に使える 90 日分の redacted feature JSONL を生成する pipeline 構築である。既存 `scripts/cf-audit-log/features/extract.ts`、`evaluation/secret-leakage-grep.ts`、`evaluation/offline-replay.ts` はあるが、production D1 から期間指定で redacted dataset を安全に export する専用 CLI、schema validation、manifest、漏洩 gate が不足しているため、コード変更を伴う実装仕様書とする。Issue #547 は CLOSED のまま扱い、PR 文脈では `Refs #547` のみ使用し `Closes #547` は使わない。

## Metadata

| 項目 | 値 |
| --- | --- |
| taskId | issue-547-cf-audit-logs-redacted-production-feature-export |
| Issue | https://github.com/daishiman/UBM-Hyogo/issues/547 |
| State | implemented_local_runtime_pending |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| Parent | `docs/30-workflows/issue-515-cf-audit-logs-ml-anomaly/` |
| Source spec | `docs/30-workflows/completed-tasks/issue-515-redacted-feature-export.md` |
| Upstream gate | Issue #546 Gate-A: 90 day baseline runtime observation |
| Scope rule | export CLI / validation / tests / docs sync は同一サイクルで実装済み。production read-only export は user gate 後のみ |

## Scope

### In

- `scripts/cf-audit-log/feature-export.ts` 新規: D1 `cf_audit_log` から 90 日 window を読み、`extractFeatures()` で ML 用 redacted feature JSONL を生成する CLI。Issue #514 の `export-to-r2.ts` は cold storage 用の既存正本として再利用可能な redaction 参考実装に留め、置換しない。
- `scripts/cf-audit-log/feature-export/schema-validation.ts` 新規: `REDACTED_FEATURES_JSON_SCHEMA` に対する決定論的 validation。
- `scripts/cf-audit-log/feature-export/manifest.ts` 新規: export metadata（window, rowCount, sha256, redaction policy, schema version）を JSON で生成。
- `scripts/cf-audit-log/d1-client.ts` 編集: 期間指定 event reader `readEventsForFeatureExport(db, window)` を追加。raw row は module 外へ返さない。
- `scripts/cf-audit-log/cli-args.ts` 既存利用: generic `parseArgs()` が `--from`, `--to`, `--days`, `--out`, `--manifest-out`, `--redact-secret-env`, `--dry-run`, `--confirm-production-export` を追加編集なしで受ける。
- `scripts/cf-audit-log/__tests__/feature-export.test.ts` 新規: export / schema validation / manifest / leakage positive-negative tests。
- `tests/fixtures/cf-audit/feature-export-raw.json` 新規: raw D1 相当 fixture。
- `.github/workflows/cf-audit-log-monitor.yml` 編集または新規 job step 追加は必須実装から外す。manual invocation は `scripts/cf.sh audit-log feature-export` と runbook に固定し、自動 production mutation はしない。
- 正本同期: `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` と `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` に redacted feature export 境界を反映。

### Out

- モデル選定、モデル学習、production ML switch。
- raw `cf_audit_log.raw_json` の外部保存。
- production D1 への mutation。読み取り export のみ。
- Issue #547 の reopen / close 状態変更。

## Implementation Contract

### Files

| Path | Type | Required change |
| --- | --- | --- |
| `scripts/cf-audit-log/feature-export.ts` | New | CLI entrypoint. Reads D1 events, extracts features, validates JSONL, runs leakage scan, writes output and manifest. |
| `scripts/cf-audit-log/feature-export/schema-validation.ts` | New | `validateRedactedFeatureLine(line, index)` and `validateRedactedFeatureJsonl(jsonl)` implementation. |
| `scripts/cf-audit-log/feature-export/manifest.ts` | New | `buildFeatureExportManifest(input)` and type definitions. |
| `scripts/cf-audit-log/d1-client.ts` | Edit | Add read-only export window query. Do not expose `raw_json`. |
| `scripts/cf-audit-log/cli-args.ts` | Existing | Reuse generic parser; no edit required for feature export flags. |
| `scripts/cf-audit-log/__tests__/feature-export.test.ts` | New | Focused unit tests. |
| `tests/fixtures/cf-audit/feature-export-raw.json` | New | Raw fixture with email/IP/UA used only to prove redaction. |
| `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | Edit | Add runbook section and evidence hygiene. |
| `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` | Edit | Add SSOT contract for redacted production feature export. |

Existing references that must be read before implementation:

| Path | Use |
| --- | --- |
| `scripts/cf-audit-log/export-to-r2.ts` | Existing cold storage exporter; reuse redaction and windowing lessons, do not merge ML dataset semantics into it. |
| `scripts/cf-audit-log/redaction-guard.ts` | Stronger JSONL guard used by Issue #514; call or mirror its fail-closed behavior where useful. |
| `scripts/cf-audit-log/evaluation/secret-leakage-grep.ts` | Required feature dataset leakage gate. |
| `scripts/cf-audit-log/manifest-store.ts` | Existing R2 manifest pattern; feature export manifest may stay local JSON and must not write production D1. |
| `.github/workflows/cf-audit-log-cold-storage.yml` | Production gate pattern G1-G4 reference. |

### Public Signatures

```ts
export type FeatureExportWindow = {
  fromUtc: Date;
  toUtc: Date;
};

export type FeatureExportLine = {
  id: string;
  occurredAt: string;
  features: RedactedFeatures;
  label?: "HIGH" | "MEDIUM" | "LOW" | "NONE";
};

export type FeatureExportManifest = {
  exportRunId: string;
  source: "cf_audit_log";
  windowFromUtc: string;
  windowToUtc: string;
  rowCount: number;
  sha256: string;
  redactionPolicyVersion: "feature-v1";
  schemaVersion: "redacted-features-v1";
  generatedAt: string;
};

export async function readEventsForFeatureExport(
  db: D1Like,
  window: FeatureExportWindow,
): Promise<AuditLogEvent[]>;

export async function exportRedactedFeatureDataset(
  input: {
    db: D1Like;
    window: FeatureExportWindow;
    redactSecret: string;
    outPath: string;
    manifestPath: string;
    now?: () => Date;
  },
): Promise<FeatureExportManifest>;
```

### Input / Output / Side Effects

| Item | Definition |
| --- | --- |
| Input | D1 `cf_audit_log` rows in `[fromUtc, toUtc)`, `CF_AUDIT_REDACT_SECRET` or configured secret env, output paths. |
| Output | Redacted JSONL dataset, manifest JSON, command logs in Phase 11 evidence. |
| Side effects | Local file writes only. D1 is read-only. GitHub Issue state is unchanged. |
| Fail closed | Missing redaction secret, invalid date window, schema validation error, or leakage hit must exit non-zero before manifest success. |

## Acceptance Criteria

- AC-1: 90 day window export command exists and writes JSONL lines shaped as `FeatureExportLine`.
- AC-2: Exported JSONL contains no raw actor email, full IPv4/IPv6, full user-agent, token-like value, or `raw_json`.
- AC-3: `secret-leakage-grep.ts` is run inside the export pipeline and causes non-zero exit on hit.
- AC-4: Schema validation checks every line against `REDACTED_FEATURES_JSON_SCHEMA` plus wrapper fields.
- AC-5: Manifest includes window, row count, SHA-256, redaction policy version, schema version, and export run id.
- AC-6: `readEventsForFeatureExport()` is read-only and returns `AuditLogEvent[]`; raw row objects and `raw_json` do not cross the function boundary.
- AC-7: Focused Vitest covers clean export, positive leakage fixture, missing secret, invalid window, manifest hash, and schema validation failure.
- AC-8: Local verification commands pass: `pnpm typecheck`, `pnpm lint`, and focused Vitest.
- AC-9: Runtime production command is user-gated and documented; no production mutation is specified.
- AC-10: SSOT/runbook docs are updated in the same implementation cycle.

## Local Commands

```bash
pnpm exec vitest run scripts/cf-audit-log/__tests__/feature-export.test.ts scripts/cf-audit-log/__tests__/features-extract.test.ts scripts/cf-audit-log/__tests__/evaluation.test.ts
pnpm typecheck
pnpm lint
CF_AUDIT_REDACT_SECRET=local-redaction-secret pnpm exec tsx scripts/cf-audit-log/feature-export.ts --fixture tests/fixtures/cf-audit/feature-export-raw.json --days 90 --out /tmp/cf-audit-features.jsonl --manifest-out /tmp/cf-audit-features.manifest.json --dry-run
pnpm exec tsx scripts/cf-audit-log/evaluation/secret-leakage-grep.ts /tmp/cf-audit-features.jsonl
```

## DoD

- All AC-1 through AC-10 are satisfied.
- Phase 11 evidence contains typecheck/lint/focused test/fixture export/leakage/schema validation logs and explicit user-gated production runtime placeholder.
- Phase 12 strict seven files are produced during implementation close-out.
- PR body uses `Refs #547` only.

## Implementation Close-Out State

| Axis | State |
| --- | --- |
| Local code | `implemented_local_runtime_pending` |
| Phase 11/12 | `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` |
| Runtime production export | `PENDING_RUNTIME_EVIDENCE` until explicit user approval |
| Issue policy | Issue #547 remains CLOSED; PR text must use `Refs #547` only |

## Phase Index

- [Phase 1](phase-01.md): Requirements and implementation classification
- [Phase 2](phase-02.md): Existing code and SSOT survey
- [Phase 3](phase-03.md): Export pipeline design
- [Phase 4](phase-04.md): I/O and CLI contract
- [Phase 5](phase-05.md): Data model and manifest schema
- [Phase 6](phase-06.md): Function signatures and pseudocode
- [Phase 7](phase-07.md): Consistency gates
- [Phase 8](phase-08.md): Error handling and security
- [Phase 9](phase-09.md): Test plan
- [Phase 10](phase-10.md): Runtime and deployment plan
- [Phase 11](phase-11.md): Evidence contract
- [Phase 12](phase-12.md): Documentation and close-out
- [Phase 13](phase-13.md): Commit / PR user gate
