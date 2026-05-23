# Phase 5 成果物: 実装差分サマリ

## 新規ファイル

| パス | 役割 |
|------|------|
| `apps/api/migrations/0018_add_audit_log_export_manifest.sql` | manifest table + 2 indexes |
| `apps/api/src/lib/audit/redact.ts` | PII redaction pure module (`redactString`/`redactJsonValue`/`redactAuditPayload`/`redactForExport`/`REDACTION_POLICY_VERSION`) |
| `apps/api/src/lib/audit/__tests__/redact.spec.ts` | TC-RED-01..07 (7 tests, pass) |
| `apps/api/src/repository/__tests__/auditLog-export.spec.ts` | TC-REP-01..06 (6 tests, pass) |
| `scripts/audit-log/export-to-r2.ts` | exporter core (deps-injected, CLI/test 兼用) |
| `scripts/audit-log/__tests__/export-to-r2.spec.ts` | TC-EXP-01..08 (8 tests, pass) |
| `scripts/audit-log/__tests__/redact-grep-gate.spec.ts` | TC-GREP-01..02 (2 tests, pass) |
| `.github/workflows/audit-log-cold-storage.yml` | daily cron `0 3 * * *` |
| `docs/30-workflows/issue-315-audit-log-application-cold-storage/operations/audit-log-retention-runbook.md` | retention / restore drill / Object Lock 解除条件 |

## 編集ファイル

| パス | 内容 |
|------|------|
| `apps/api/src/repository/auditLog.ts` | `listForExport` / `insertExportManifest` / `completeExportManifest` / `failExportManifest` / `findExportManifestByPartition` / `purgeExportedOlderThan` 追加 |
| `apps/api/src/repository/__tests__/_setup.ts` | TABLES に `audit_log_export_manifest` 追加 |
| `apps/api/wrangler.toml` | `UBM_AUDIT_APP_COLD_STORAGE` binding を production / staging に追加 |

## 検証結果

- `mise exec -- pnpm typecheck`: PASS
- `mise exec -- pnpm lint`: PASS
- `mise exec -- pnpm --filter @ubm-hyogo/api test`: 319 tests pass (新規 13 tests 含む)
- `mise exec -- pnpm exec vitest run scripts/audit-log`: 10 tests pass

## Phase 11 user gate 待ち（未実施）

- `bash scripts/cf.sh r2 bucket create ubm-audit-cold-storage-app-prod --object-lock-enabled`
- `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production`
- `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production`
