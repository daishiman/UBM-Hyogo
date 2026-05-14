# Artifact Inventory: task-10 follow-up 001 OpenNext esbuild mismatch

| Field | Value |
| --- | --- |
| canonical task root | `docs/30-workflows/task-10-followup-001-opennext-esbuild-mismatch/` |
| state | `implemented-local / implementation / NON_VISUAL / runtime_evidence_captured` |
| source task | `docs/30-workflows/unassigned-task/task-10-followup-001-opennext-esbuild-mismatch.md` |
| parent | `docs/30-workflows/completed-tasks/task-10-ui-primitives-spec/` |

## Implementation Files

| Path | Purpose |
| --- | --- |
| `package.json` | Root `pnpm.overrides.esbuild = "0.25.4"` |
| `pnpm-lock.yaml` | Regenerated esbuild convergence lockfile |
| `scripts/cf.sh` | Recovery note; wrapper route preserved |

## Evidence

| Evidence | Path |
| --- | --- |
| baseline failure | `docs/30-workflows/task-10-followup-001-opennext-esbuild-mismatch/outputs/phase-11/evidence/before-build-cloudflare.log` |
| fixed build | `docs/30-workflows/task-10-followup-001-opennext-esbuild-mismatch/outputs/phase-11/evidence/after-build-cloudflare.log` |
| dependency convergence | `docs/30-workflows/task-10-followup-001-opennext-esbuild-mismatch/outputs/phase-11/evidence/after-pnpm-why-esbuild.log` |
| platform scan | `docs/30-workflows/task-10-followup-001-opennext-esbuild-mismatch/outputs/phase-11/evidence/esbuild-versions.log` |
| root typecheck | `docs/30-workflows/task-10-followup-001-opennext-esbuild-mismatch/outputs/phase-11/evidence/root-typecheck.log` |
| root lint | `docs/30-workflows/task-10-followup-001-opennext-esbuild-mismatch/outputs/phase-11/evidence/root-lint.log` |
| wrapper smoke | `docs/30-workflows/task-10-followup-001-opennext-esbuild-mismatch/outputs/phase-11/evidence/cf-sh-wrapper-version.log` |

## Phase 12

Strict seven files are present under `outputs/phase-12/`, and root/output `artifacts.json` parity is maintained.

