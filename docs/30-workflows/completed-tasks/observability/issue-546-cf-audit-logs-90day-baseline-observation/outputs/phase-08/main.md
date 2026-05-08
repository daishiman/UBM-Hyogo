# Phase 8 Output: Error / Missing Evidence Handling

Status: `PASS_WITH_CLASSIFIED_RUNTIME_BLOCKERS`

## Classified Results

| Code | Evidence | Handling |
| --- | --- | --- |
| `insufficient_window` | monitor evidence contains 32 runs from 2026-05-06T10:43:50Z to 2026-05-07T21:22:18Z | Gate-A FAIL; continue observation |
| `watchdog_gap_detected` | watchdog evidence contains 32 failures from 2026-05-06T10:56:06Z to 2026-05-07T21:34:26Z | Gate-A FAIL |
| `runtime_schema_missing` | D1 read-only query returned `no such table: cf_audit_log` | Gate-B PENDING until production D1 migration/readiness is confirmed |
| `local_toolchain_mismatch` | baseline helper failed with esbuild host 0.27.3 vs binary 0.21.5 | baseline thresholds PENDING |
| `manual_tuning_log_missing` | issue search found related issues but no owner-authored monthly tuning minutes | Gate-C PENDING |

## Handoff

Proceed to Phase 9 with Gate-A FAIL and Gate-B/C pending.
