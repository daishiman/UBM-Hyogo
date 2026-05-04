# UT-07B-FU-03 Production Migration Apply Runbook Artifact Inventory

## Metadata

| Item | Value |
| --- | --- |
| Workflow | `docs/30-workflows/unassigned-task/task-ut-07b-fu-03-production-migration-apply-runbook.md` |
| Status | `spec_created / implemented-local scripts / directory root not materialized in this worktree` |
| Task type | `implementation / operations / runbook + scripts` |
| visualEvidence | `NON_VISUAL` |
| Issue | #363 CLOSED, `Refs #363` only |

## Canonical Artifacts

| Artifact | Path | Status |
| --- | --- | --- |
| Task stub | `docs/30-workflows/unassigned-task/task-ut-07b-fu-03-production-migration-apply-runbook.md` | canonical in this worktree |
| Root index | `docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/index.md` | not materialized in this worktree |
| Root ledger | `docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/artifacts.json` | not materialized in this worktree |
| Outputs ledger | `docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/outputs/artifacts.json` | not materialized in this worktree |
| Phase files | `docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/phase-01.md` ... `phase-13.md` | not materialized in this worktree |
| Output phase files | `docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/outputs/phase-*/main.md` | not materialized in this worktree |
| Phase 11 evidence | historical UT-07B-FU-03 local evidence | PR runtime evidence remains gated |
| Phase 12 strict files | historical UT-07B-FU-03 local evidence | directory root not present in this worktree |
| D1 scripts | `scripts/d1/{preflight,postcheck,evidence,apply-prod}.sh` | implemented-local |
| Wrapper | `scripts/cf.sh` (`d1:apply-prod`) | implemented-local |
| CI gate | `.github/workflows/d1-migration-verify.yml` | implemented-local / PR runtime gated |
| Script tests | `scripts/d1/__tests__/*.bats` | implemented-local |
| Local runtime evidence | `.evidence/d1/<ts>/` | generated / gitignored / not a canonical artifact |

## Boundary

This inventory records the current discoverable runbook stub and implemented script locations only. It does not claim production migration execution, production D1 state changes, or materialized workflow directory parity for a directory that is absent from this worktree.
This inventory records the runbook location and artifact parity only. It does not claim production migration execution or production D1 state changes.

## FU-04 Verification Boundary

FU-04 (`docs/30-workflows/ut-07b-fu-04-production-migration-apply-execution/`) consumes this runbook but does not convert FU-03 into an execution record. Because `references/database-schema.md` already records `0008_schema_alias_hardening.sql` as applied in production D1 ledger at `2026-05-01 08:21:04 UTC`, FU-04 is treated as an already-applied verification and duplicate-apply prohibition workflow. Cloudflare runtime verification remains blocked until explicit user approval.
