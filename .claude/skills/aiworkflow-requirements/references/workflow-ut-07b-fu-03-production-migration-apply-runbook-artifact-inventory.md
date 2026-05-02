# UT-07B-FU-03 Production Migration Apply Runbook Artifact Inventory

## Metadata

| Item | Value |
| --- | --- |
| Workflow | `docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/` |
| Status | `spec_created` |
| Task type | `requirements / operations / runbook` |
| visualEvidence | `NON_VISUAL` |
| Issue | #363 CLOSED, `Refs #363` only |

## Canonical Artifacts

| Artifact | Path | Status |
| --- | --- | --- |
| Root index | `docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/index.md` | materialized |
| Root ledger | `docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/artifacts.json` | materialized |
| Outputs ledger | `docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/outputs/artifacts.json` | parity with root |
| Phase files | `docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/phase-01.md` ... `phase-13.md` | materialized |
| Output phase files | `docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/outputs/phase-*/main.md` | materialized |
| Phase 11 evidence | `docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/outputs/phase-11/` | document checks materialized; staging dry-run is operator gate |
| Phase 12 strict files | `docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/outputs/phase-12/` | 7 files materialized |

## Boundary

This inventory records the runbook location and artifact parity only. It does not claim production migration execution or production D1 state changes.
