# Implementation Guide

Status: spec_created  
Runtime evidence: pending_user_approval

## Part 1: Simple Explanation

This task is like opening a new public service counter after rehearsing with staff. 09a confirms the rehearsal site works. 09b prepares the emergency manual. 09c is the day the real counter opens: check the keys, make a backup, open the doors, watch the first visitors, label the release, share the emergency manual, and check the usage the next day.

The important idea is separation:

- Staging proves the release candidate is ready.
- Production deploy changes the real service.
- Release tag labels exactly which code went live.
- 24h verification checks whether the real service stayed healthy.
- Rollback procedures explain how to recover if something goes wrong.

## Part 2: Developer Guide

### Runtime Types

```ts
export type ReleaseTag = `v${string}`;

export interface ProductionDeployContext {
  productionApi: string;
  productionWeb: string;
  productionD1: "ubm_hyogo_production";
  releaseTag: ReleaseTag;
  mainCommit: string;
  approvedBy: string;
}

export interface StepEvidence {
  step: number;
  name: string;
  startedAt: string;
  finishedAt: string;
  commandSummary: string;
  exitCode: number | "manual";
  result: "PASS" | "FAIL" | "SKIPPED" | "TBD";
  artifactPath?: string;
}

export interface PostReleaseMetrics {
  workersRequests24h: number;
  d1Reads24h: number;
  d1Writes24h: number;
  measuredAt: string;
}
```

### API / Command Surface

| Operation | Command / endpoint |
| --- | --- |
| D1 backup | `bash scripts/cf.sh d1 export ubm_hyogo_production --remote --env production` |
| D1 migration list | `bash scripts/cf.sh d1 migrations list ubm_hyogo_production --remote --env production` |
| D1 migration apply | `bash scripts/cf.sh d1 migrations apply ubm_hyogo_production --remote --env production` |
| API deploy | `pnpm --filter @ubm/api deploy:production` |
| Web deploy | `pnpm --filter @ubm/web deploy:production` |
| Schema sync | `POST ${PRODUCTION_API}/admin/sync/schema` |
| Response sync | `POST ${PRODUCTION_API}/admin/sync/responses` |
| Release tag | `git tag -a "$RELEASE_TAG" -m "Production release $RELEASE_TAG"` |

### Error Handling

| Error | Handling |
| --- | --- |
| Missing secret | Stop deploy; return to infrastructure secret task. |
| Migration failure | Stop; use backup and forward fix migration procedure. |
| API deploy failure | Stop; inspect wrangler output and use Worker rollback if required. |
| Web deploy failure | Stop; inspect Pages/OpenNext output and use Pages rollback if required. |
| Smoke authz failure | Treat as NO-GO or incident depending on timing and exposure. |
| Metric threshold breach | Follow 09b incident path and consider cron/query mitigation. |

### Edge Cases

- Existing release tag: abort and choose a new tag; do not overwrite.
- Backup missing or zero bytes: do not apply migrations.
- Secret list prints names only: never paste secret values into evidence.
- 24h verification incomplete: keep release summary in pending runtime evidence state.

### Verification Commands

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
rg "D1Database" apps/web/.vercel/output/
bash scripts/cf.sh d1 execute ubm_hyogo_production \
  --command "SELECT session_id, member_id, COUNT(*) c FROM attendances WHERE deleted_at IS NULL GROUP BY session_id, member_id HAVING c > 1;" \
  --remote --env production --config apps/api/wrangler.toml
```

### Phase 11 Evidence References

09c is a VISUAL workflow, but runtime capture is intentionally pending user approval. These paths are templates/placeholders until `docs/30-workflows/unassigned-task/task-09c-production-deploy-execution-001.md` executes:

| Evidence | Path | Current state |
| --- | --- | --- |
| Production smoke screenshots / traces | `outputs/phase-11/playwright-production/` | pending runtime capture |
| Manual smoke runbook | `outputs/phase-11/production-smoke-runbook.md` | template complete |
| Sync job result | `outputs/phase-11/sync-jobs-production.json` | pending runtime values |
| Worker tail log | `outputs/phase-11/wrangler-tail-production.log` | pending runtime values |
| Release tag proof | `outputs/phase-11/release-tag-evidence.md` | pending runtime values |
| Incident runbook share proof | `outputs/phase-11/share-evidence.md` | pending runtime values |
| 24h Analytics / SQL proof | `outputs/phase-11/post-release-24h-evidence.md` | pending runtime values |
