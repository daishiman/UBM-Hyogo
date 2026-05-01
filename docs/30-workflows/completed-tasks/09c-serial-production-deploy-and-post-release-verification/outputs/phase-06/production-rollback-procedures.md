# Production Rollback Procedures

Status: spec_created  
Runtime evidence: pending_user_approval

## Failure Cases

| Failure | Step | Detection | Mitigation |
| --- | --- | --- | --- |
| F-1 merge conflict | 1 | `gh pr merge` error | Rebase/fix on dev and reopen PR. |
| F-2 upstream pending | 2 | artifacts show pending | Stop 09c and return to 09a / 09b. |
| F-3 D1 backup failure | 3 | `bash scripts/cf.sh d1 export` error | Retry after Cloudflare status check; do not continue without backup. |
| F-4 migration list failure | 4 | `bash scripts/cf.sh d1 migrations list` error | Check wrapper auth, account, binding, env. |
| F-5 migration apply failure | 5 | `bash scripts/cf.sh d1 migrations apply` error / inconsistent D1 state | Use backup and forward fix migration strategy. |
| F-6 secret missing | 6 | required name absent | Stop and route to infrastructure secret registration. |
| F-7 API deploy failure | 7 | deploy command exit nonzero | Route to owning API/deployment task; rollback if partial deployment affected prod. |
| F-8 web deploy failure | 8 | pages deploy exit nonzero | Route to web/OpenNext configuration owner. |
| F-9 smoke failure | 9 | 404 / 403 / 500 / UI invariant mismatch | Use Worker or Pages rollback when blast radius requires. |
| F-10 manual sync failure | 10 | `sync_jobs.failed` or API error | Pause cron if repeated and return to sync owner. |
| F-11 tag push failure | 11 | remote tag missing | Fix GitHub access or choose new tag; do not overwrite existing tag. |
| F-12 runbook share failure | 12 | no receipt | Resend through Slack and Email; record final evidence. |
| F-13 24h verify breach | 13 | metric threshold or invariant failure | Incident path, cron/query mitigation, optional API rollback. |

## A. Worker Rollback

```bash
bash scripts/cf.sh deployments list --config apps/api/wrangler.toml --env production
bash scripts/cf.sh rollback <prev_deploy_id> --config apps/api/wrangler.toml --env production
curl -sI "https://ubm-hyogo-api.<account>.workers.dev/public/stats" | head -1
```

Expected: production API returns expected status within the rollback window.  
Runtime evidence: TBD at execution.

## B. Pages Rollback

Cloudflare Dashboard path:

```text
Pages -> ubm-hyogo-web -> Deployments -> select previous Production deployment -> Rollback
```

Expected: hard reload of production web URL returns the previous deployment.  
Runtime evidence: TBD at execution.

## C. D1 Migration Recovery

Preferred path is a forward-compatible fix migration, not destructive ad hoc SQL.

```bash
bash scripts/cf.sh d1 migrations create ubm_hyogo_production fix_<issue> \
  --config apps/api/wrangler.toml --env production
bash scripts/cf.sh d1 migrations apply ubm_hyogo_production \
  --remote --env production --config apps/api/wrangler.toml
bash scripts/cf.sh d1 migrations list ubm_hyogo_production \
  --remote --env production --config apps/api/wrangler.toml
```

Emergency data repair must preserve invariants #4 and #15 and follow the infrastructure runbook.  
Runtime evidence: TBD at execution.

## D. Cron Rollback / Temporary Pause

Template:

```bash
# Set production cron triggers to an empty list in the approved deployment config,
# then redeploy the production API worker.
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production
```

Expected: Cloudflare dashboard shows no active production cron triggers during pause.  
Runtime evidence: TBD at execution.

## E. Release Tag Cancellation / Replacement

Use only when a tag was published incorrectly and the impact is understood.

```bash
TAG=vYYYYMMDD-HHMM
git tag -d "$TAG"
git push origin --delete "$TAG"
NEW_TAG="v$(date +%Y%m%d-%H%M)"
git tag -a "$NEW_TAG" -m "Production release ${NEW_TAG} (replaces ${TAG})"
git push origin "$NEW_TAG"
```

Default rule: do not overwrite tags. Prefer a hotfix release with a new tag.  
Runtime evidence: TBD at execution.

## Invariant Checks After Rollback

```bash
rg "D1Database" apps/web/.vercel/output/ || echo "no D1 import in web bundle: PASS"
bash scripts/cf.sh d1 execute ubm_hyogo_production \
  --command "SELECT session_id, member_id, COUNT(*) c FROM attendances WHERE deleted_at IS NULL GROUP BY session_id, member_id HAVING c > 1;" \
  --remote --env production --config apps/api/wrangler.toml
```

Do not mark these PASS until actual post-rollback evidence exists.
