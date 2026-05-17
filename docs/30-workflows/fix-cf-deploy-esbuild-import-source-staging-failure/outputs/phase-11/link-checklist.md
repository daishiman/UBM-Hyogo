# Link Checklist

## Workflow Internal Links

| Source | Target | Check | Verdict |
| --- | --- | --- | --- |
| `artifacts.json` | `outputs/phase-01/dependency-map.md` | file exists | PASS |
| `artifacts.json` | `outputs/phase-05/local-verification.md` | file exists | PASS |
| `artifacts.json` | `outputs/phase-06/test-impact.md` | file exists | PASS |
| `artifacts.json` | `outputs/phase-07/integration-plan.md` | file exists | PASS |
| `artifacts.json` | `outputs/phase-09/acceptance.md` | file exists | PASS |
| `artifacts.json` | `outputs/phase-11/main.md` | file exists | PASS |
| `artifacts.json` | `outputs/phase-12/phase12-task-spec-compliance-check.md` | file exists | PASS |

## Implementation Links

| Target | Check | Verdict |
| --- | --- | --- |
| `package.json` | `pnpm.overrides.esbuild = "0.27.3"` | PASS |
| `pnpm-lock.yaml` | lockfile resolves `esbuild@0.27.3` | PASS |
| `scripts/cf.sh` | wrapper comment references wrangler + OpenNext convergence | PASS |

## Mirror And System Spec Links

| Source | Target | Check | Verdict |
| --- | --- | --- | --- |
| root `artifacts.json` | `outputs/artifacts.json` | `cmp -s` parity | PASS |
| `outputs/phase-12/system-spec-update-summary.md` | `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | current esbuild override SSOT note present | PASS |
| `outputs/phase-12/system-spec-update-summary.md` | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | current workflow root entry present | PASS |
| `outputs/phase-12/system-spec-update-summary.md` | `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | current workflow root entry present | PASS |
| `outputs/phase-12/system-spec-update-summary.md` | `.claude/skills/aiworkflow-requirements/references/workflow-fix-cf-deploy-esbuild-import-source-staging-failure-artifact-inventory.md` | artifact inventory present | PASS |
