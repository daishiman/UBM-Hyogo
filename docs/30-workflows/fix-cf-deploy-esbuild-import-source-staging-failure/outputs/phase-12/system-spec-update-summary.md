# System Spec Update Summary

## Step 1-A: Task Record

This wave establishes `docs/30-workflows/fix-cf-deploy-esbuild-import-source-staging-failure/` as the current canonical root for the esbuild `import-source` deploy recovery. Existing aiworkflow references to the missing root `docs/30-workflows/completed-tasks/fix-wrangler-esbuild-import-source-error/` are stale and are retargeted to this root.

## Step 1-B: State

| Field | Value |
| --- | --- |
| workflow_state | `implemented_local_evidence_captured` |
| verdict | `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` |
| implementation_status | `implementation_complete_local_verification_pending` |

The root is not `spec_created` because `package.json`, `pnpm-lock.yaml`, and `scripts/cf.sh` changed in the same cycle.

## Step 1-C: Related Tasks

The previous `task-10-followup-001-opennext-esbuild-mismatch` introduced the older `0.25.4` convergence for a different OpenNext failure. This task supersedes that value for current wrangler 4.85.0 deploy behavior.

## Step 1-H: Skill Feedback Routing

No task-specification-creator template change is required. The issue was workflow-local incompleteness: missing outputs, stale aiworkflow links, and root state drift.

## Step 2: System Specification Update

`scripts/cf.sh` was updated to describe wrangler and OpenNext as joint constraints for the override. `deployment-secrets-management.md` receives a short SSOT note because it already owns the Cloudflare wrapper contract.

## Generated Index / Search Sync

| Target | Action | Result |
| --- | --- | --- |
| `indexes/resource-map.md` | manual same-wave update | current workflow root and artifact inventory are present |
| `indexes/quick-reference.md` | manual same-wave update | current workflow root is searchable from Cloudflare deploy recovery context |
| `indexes/topic-map.md` | `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js` | regenerated successfully |
| `indexes/keywords.json` | `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js` | regenerated successfully; no diff after deterministic generation |

Regeneration command executed in this review cycle:

```bash
node .claude/skills/aiworkflow-requirements/scripts/generate-index.js
```

This review cycle did not commit or push, so generated index churn is kept scoped to direct SSOT files unless the generator reports deterministic updates.
