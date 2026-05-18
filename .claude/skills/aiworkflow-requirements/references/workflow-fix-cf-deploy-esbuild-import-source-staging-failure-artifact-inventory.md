# Artifact Inventory: fix-cf-deploy-esbuild-import-source-staging-failure

| Field | Value |
| --- | --- |
| canonical task root | `docs/30-workflows/fix-cf-deploy-esbuild-import-source-staging-failure/` |
| state | `implemented_local_evidence_captured / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` |
| branch | `fix/cf-deploy-esbuild-import-source-staging-failure` |
| related PR | `#461` |

## Implementation Files

| Path | Purpose |
| --- | --- |
| `package.json` | Root `pnpm.overrides.esbuild = "0.27.3"` |
| `pnpm-lock.yaml` | Regenerated esbuild convergence lockfile |
| `scripts/cf.sh` | Cloudflare wrapper SSOT comment aligned to wrangler + OpenNext convergence |

## Evidence

| Evidence | Path |
| --- | --- |
| dependency map | `docs/30-workflows/fix-cf-deploy-esbuild-import-source-staging-failure/outputs/phase-01/dependency-map.md` |
| local verification | `docs/30-workflows/fix-cf-deploy-esbuild-import-source-staging-failure/outputs/phase-05/local-verification.md` |
| NON_VISUAL evidence | `docs/30-workflows/fix-cf-deploy-esbuild-import-source-staging-failure/outputs/phase-11/ci-evidence.md` |
| Phase 12 compliance | `docs/30-workflows/fix-cf-deploy-esbuild-import-source-staging-failure/outputs/phase-12/phase12-task-spec-compliance-check.md` |

## Phase 12

Strict seven files are present under `outputs/phase-12/`, and `outputs/artifacts.json` mirrors the root workflow state.
