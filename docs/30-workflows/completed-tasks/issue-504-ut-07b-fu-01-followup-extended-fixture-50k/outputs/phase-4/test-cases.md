# Phase 4 Test Cases

## Fixture Generation

| ID | Assertion |
| --- | --- |
| TC-GEN-01 | `generateRow(index)` is deterministic. |
| TC-GEN-02 | `generateAll(50000)` returns exactly 50,000 unique `dedupe_key` values. |
| TC-GEN-03 | Every `dedupe_key` starts with `ubm-test-fixture-50k-`. |
| TC-GEN-04 | Generated text does not match `@gmail|@senpai-lab|token|secret` case-insensitively. |
| TC-GEN-05 | SQL chunk size is 500 rows per INSERT chunk. |

## Seed / Cleanup

| ID | Assertion |
| --- | --- |
| TC-SEED-01 | `--env production` exits 1 before invoking `scripts/cf.sh`. |
| TC-SEED-02 | `CLOUDFLARE_ENV=production` exits 1 before invoking `scripts/cf.sh`. |
| TC-SEED-03 | dry-run prints deterministic SQL command plan and performs no write. |
| TC-SEED-04 | seed count selector is `dedupe_key LIKE 'ubm-test-fixture-50k-%'`. |
| TC-CLEAN-01 | cleanup without `--confirm` is dry-run only. |
| TC-CLEAN-02 | cleanup with `--confirm` uses the same selector as seed verification. |

## Stress Trial Driver

| ID | Assertion |
| --- | --- |
| TC-TRIAL-01 | trigger path is `/admin/schema/backfill/trigger`; scheduled waiting is not an alternative path. |
| TC-TRIAL-02 | polling interval is 10 seconds and timeout is 1800 seconds. |
| TC-TRIAL-03 | abort thresholds are retry_count > 3, dlq_count > 0, cpu_ms > 250000, or timeout. |
| TC-TRIAL-04 | dry-run emits deterministic JSON plan and no runtime write. |
