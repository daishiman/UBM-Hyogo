# UT-07B-FU-03 Production Migration Apply Runbook Artifact Inventory

## Metadata

| Item | Value |
| --- | --- |
| Workflow | `docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/` |
| Status | `spec_created` |
| Task type | `implementation / operations / runbook + scripts` |
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
| Phase 11 evidence | `docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/outputs/phase-11/` | document checks materialized; PR runtime evidence remains gated |
| Phase 12 strict files | `docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/outputs/phase-12/` | 7 files materialized |
| D1 scripts | `scripts/d1/{preflight,postcheck,evidence,apply-prod}.sh` | implemented-local |
| Wrapper | `scripts/cf.sh` (`d1:apply-prod`) | implemented-local |
| CI gate | `.github/workflows/d1-migration-verify.yml` | implemented-local / PR runtime gated |
| Script tests | `scripts/d1/__tests__/*.bats` | implemented-local |
| Local runtime evidence | `.evidence/d1/<ts>/` | generated / gitignored / not a canonical artifact |

## Boundary

This inventory records the runbook location and artifact parity only. It does not claim production migration execution or production D1 state changes.
