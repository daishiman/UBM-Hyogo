# Phase 3 Output: Design

Verdict: `COMPLETED`

Implemented module design:

- `scripts/cf-audit-log/feature-export.ts`
- `scripts/cf-audit-log/feature-export/schema-validation.ts`
- `scripts/cf-audit-log/feature-export/manifest.ts`

Data flow:

1. Parse CLI window from `--days` or `--from/--to`.
2. Read `cf_audit_log` through `readEventsForFeatureExport()`.
3. Convert rows through `extractFeatures()`.
4. Validate JSONL line schema.
5. Run `guardJsonlOrThrow()` and `scanForSecrets()`.
6. Publish final JSONL and manifest only after all local gates pass.
