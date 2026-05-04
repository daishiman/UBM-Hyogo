# UT-07B-FU-04 Production Migration Already-Applied Verification Artifact Inventory

## Canonical Workflow

| Field | Value |
| --- | --- |
| workflow | `docs/30-workflows/ut-07b-fu-04-production-migration-apply-execution/` |
| status | `spec_created / implementation / NON_VISUAL / completed_boundary_runtime_pending` |
| issue | #424 (CLOSED, keep closed) |
| target DB | `ubm-hyogo-db-prod` |
| target migration fact | `0008_schema_alias_hardening.sql` already recorded as production-applied at `2026-05-01 08:21:04 UTC` |

## Boundary

FU-04 is not a duplicate production apply task. It consumes the FU-03 runbook context and the `database-schema.md` production D1 ledger fact, then records:

- already-applied verification boundary
- duplicate apply prohibition
- user-gated read-only runtime verification path
- placeholder evidence until user approval

`outputs/phase-11/apply.log` is no-op prohibition evidence. It is not an apply success log.

## Artifact Set

| Artifact | Meaning |
| --- | --- |
| `artifacts.json` / `outputs/artifacts.json` | root/outputs parity; Phase 11/12 are `completed_boundary_runtime_pending` |
| `outputs/phase-11/preflight-list.log` | placeholder or read-only `migrations list` evidence |
| `outputs/phase-11/apply.log` | `FORBIDDEN / not_run_duplicate_apply_prohibited` evidence |
| `outputs/phase-11/post-check.log` | placeholder or hardening columns read-only post-check |
| `outputs/phase-11/user-approval-record.md` | approval state; currently `blocked_until_user_approval` |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | strict 7 files + runtime boundary check |
| `references/lessons-learned-ut07b-fu04-production-migration-already-applied-verification-2026-05.md` | L-UT07B-FU04-001〜004（duplicate apply 禁止 / preflight 二モード / post-check scope 縮約 / placeholder + user-gate runtime 分離） |

## Post-check Scope

The hardening migration `apps/api/migrations/0008_schema_alias_hardening.sql` only adds:

- `schema_diff_queue.backfill_cursor`
- `schema_diff_queue.backfill_status`

`schema_aliases` table and UNIQUE indexes belong to `0008_create_schema_aliases.sql` and must not be required as FU-04 hardening post-check PASS conditions.
