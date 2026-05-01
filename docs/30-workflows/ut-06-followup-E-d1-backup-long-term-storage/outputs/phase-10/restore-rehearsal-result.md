# Restore Rehearsal Result (Template)

## Status

- workflow state: `spec_created`
- task type: `docs-only`
- visualEvidence: `NON_VISUAL`
- execution status: **TEMPLATE — not executed in this PR**

## Purpose

This file records the monthly D1 restore walkthrough outcome. In the current spec_created PR it is the empty template; the first populated record is created by the post-Phase-13 implementation PR (or the operations record that follows the first real cron run).

## Template Schema

| Field | Description |
| --- | --- |
| `walkthrough_date` | YYYY-MM-DD of the walkthrough |
| `mode` | `desk` (paper walkthrough) or `live-drill` (restore into a drill D1 binding) |
| `source_export_uri` | R2 object URI of the export under test |
| `source_sha256` | SHA-256 captured at put time (from R2 object metadata) |
| `restore_sha256` | SHA-256 recomputed before restore — MUST match `source_sha256` |
| `target_db` | D1 binding restored into (drill database for `live-drill`) |
| `restore_seconds` | Wall-clock seconds from `cf.sh d1 execute` start to completion |
| `row_count_before` | Row count of the canary table at the source export's logical timestamp |
| `row_count_after` | Row count of the same table after restore — MUST match `row_count_before` |
| `rto_target_met` | `true` if `restore_seconds` < 900 (15 min RTO) |
| `issues` | Free-form list of anomalies observed |
| `next_actions` | Follow-ups, runbook updates, or escalations |

## Walkthrough Log

| walkthrough_date | mode | source_export_uri | source_sha256 | restore_sha256 | target_db | restore_seconds | row_count_before | row_count_after | rto_target_met | issues | next_actions |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| _(none yet)_ | — | — | — | — | — | — | — | — | — | — | — |

## Boundary

No restore has been executed in this PR. The first row is appended by the operations record that accompanies the first real cron run after the implementation PR ships.
