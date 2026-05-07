# Phase 11 Manual Smoke Log

判定: `SPEC_CONTRACT_READY_RUNTIME_PENDING`

本ファイルは Issue #514 実装後に実行する NON_VISUAL evidence command ledger である。現時点では task specification close-out のため、production mutation / fixture script execution は未実行。

| ID | コマンド | 期待結果 | 現状 |
| --- | --- | --- | --- |
| C-1 | `mise exec -- pnpm typecheck` | exit 0 | NOT_EXECUTED_THIS_CYCLE_NO_CODE_CHANGE |
| C-2 | `mise exec -- pnpm lint` | exit 0 | NOT_EXECUTED_THIS_CYCLE_NO_CODE_CHANGE |
| C-3 | `mise exec -- pnpm --filter @repo/api test:run -- scripts/cf-audit-log/export-to-r2.test.ts` | export focused test PASS | BLOCKED_UNTIL_SCRIPT_EXISTS |
| C-4 | `mise exec -- pnpm --filter @repo/api test:run -- scripts/cf-audit-log/restore-drill.test.ts` | restore drill focused test PASS | BLOCKED_UNTIL_SCRIPT_EXISTS |
| C-5 | `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production` | `0015_add_audit_export_manifest.sql` pending | RUNTIME_PENDING_USER_APPROVAL |
| C-6 | `rg -n 'Bearer |password|secret|api[_-]?key' outputs/phase-11/` | credential-like match 0 | PENDING_AFTER_LOGS_EXIST |
| C-7 | `scripts/cf-audit-log/export-to-r2.ts --dry-run --fixture <path>` | redaction violation 0 | BLOCKED_UNTIL_SCRIPT_EXISTS |
| C-8 | `scripts/cf-audit-log/restore-drill.ts --fixture <path>` | row count / hash match | BLOCKED_UNTIL_SCRIPT_EXISTS |

No production R2 / D1 / Secret mutation is authorized by this Phase 11 ledger.
