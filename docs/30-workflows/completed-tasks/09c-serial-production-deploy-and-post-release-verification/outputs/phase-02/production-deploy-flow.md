# Production Deploy Flow

Status: spec_created  
Runtime evidence: pending_user_approval

| Step | Name | Command / operation | Expected check | Runtime evidence |
| --- | --- | --- | --- | --- |
| 1 | main promotion precondition | `gh pr merge <dev_to_main_pr_number> --squash` | latest main commit matches approved dev -> main PR | TBD at execution |
| 2 | pre-deploy check | inspect 09a / 09b artifacts | all required upstream phases completed | TBD at execution |
| 3 | D1 backup | `bash scripts/cf.sh d1 export ubm_hyogo_production --remote --output=backup-production-<ts>.sql --env production --config apps/api/wrangler.toml` | backup file exists and size > 0 | TBD at execution |
| 4 | D1 migration list | `bash scripts/cf.sh d1 migrations list ubm_hyogo_production --remote --env production --config apps/api/wrangler.toml` | all migrations Applied | TBD at execution |
| 5 | D1 migration apply | `bash scripts/cf.sh d1 migrations apply ubm_hyogo_production --remote --env production --config apps/api/wrangler.toml` | exit 0, list remains Applied | TBD at execution |
| 6 | secrets check | `bash scripts/cf.sh secret list --env production` and `bash scripts/cf.sh pages secret list --project-name ubm-hyogo-web` | required 7 secrets present; values not printed | TBD at execution |
| 7 | API deploy | `pnpm --filter @ubm/api deploy:production` | exit 0 and production worker deployed | TBD at execution |
| 8 | Web deploy | `pnpm --filter @ubm/web deploy:production` | exit 0 and production web URL updated | TBD at execution |
| 9 | 10 route smoke | curl + manual browser checks | public/auth/admin routes match expected status and authz | TBD at execution |
| 10 | manual sync | `POST /admin/sync/schema` and `POST /admin/sync/responses` | `sync_jobs.status='success'` rows recorded | TBD at execution |
| 11 | release tag | `git tag -a "$RELEASE_TAG"` and `git push origin "$RELEASE_TAG"` | remote tag exists | TBD at execution |
| 12 | runbook share | Slack / Email share of 09b incident runbook | `share-evidence.md` records delivery | TBD at execution |
| 13 | 24h verify | Cloudflare Analytics + SQL / bundle checks | metrics under thresholds and invariant evidence recorded | TBD at execution |

## Staging vs Production Differences

| Item | Staging | Production |
| --- | --- | --- |
| Branch | `dev` | `main` |
| API worker | `ubm-hyogo-api-staging` | `ubm-hyogo-api` |
| Web project | `ubm-hyogo-web-staging` | `ubm-hyogo-web` |
| D1 database | `ubm_hyogo_staging` | `ubm_hyogo_production` |
| Approval | dev/staging handoff | user approval gates at Phase 10, 11, and 13 |
| Backup | optional | required before migration apply |
| Release tag | not required | required, immutable, `vYYYYMMDD-HHMM` |
| Verification window | staging-specific | required 24h post-release window |
