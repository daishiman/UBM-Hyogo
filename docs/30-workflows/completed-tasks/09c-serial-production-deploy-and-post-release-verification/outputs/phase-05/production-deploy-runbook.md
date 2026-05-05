# Production Deploy Runbook

Status: spec_created  
Runtime evidence: pending_user_approval

## Preconditions

- Phase 10 GO / NO-GO result is GO.
- User approval gate 1/3 is recorded.
- User approval gate 2/3 is recorded before any production command.
- 09a and 09b handoff evidence is available.
- Real account, URL, release tag, commit hash, and credentials are filled at execution time.

## Step 1: main promotion precondition

```bash
# Execute only after the 09c docs-only PR has merged to dev and a separate dev -> main PR is CI green.
gh pr merge <dev_to_main_pr_number> --squash --delete-branch=false
git fetch origin main
git checkout main
git pull origin main
git log --oneline -1
```

Sanity: latest main commit matches the approved dev -> main PR.  
Evidence: TBD at execution.

## Step 2: pre-deploy check

```bash
jq '.phases[] | select(.status != "completed")' docs/30-workflows/02-application-implementation/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/artifacts.json
jq '.phases[] | select(.status != "completed")' docs/30-workflows/02-application-implementation/09b-parallel-cron-triggers-monitoring-and-release-runbook/artifacts.json
```

Sanity: no blocking pending phases for required handoff artifacts.  
Evidence: TBD at execution.

## Step 3: D1 backup

```bash
TS=$(date +%Y%m%d-%H%M)
bash scripts/cf.sh d1 export ubm_hyogo_production \
  --remote \
  --output="backup-production-${TS}.sql" \
  --env production \
  --config apps/api/wrangler.toml
ls -la "backup-production-${TS}.sql"
```

Sanity: backup file exists and size is greater than zero. Do not commit backup files.  
Evidence: TBD at execution.

## Step 4: D1 migration list

```bash
bash scripts/cf.sh d1 migrations list ubm_hyogo_production \
  --remote \
  --env production \
  --config apps/api/wrangler.toml
```

Sanity: all migrations are Applied, or pending migrations are understood before Step 5.  
Evidence: TBD at execution.

## Step 5: D1 migration apply

```bash
bash scripts/cf.sh d1 migrations apply ubm_hyogo_production \
  --remote \
  --env production \
  --config apps/api/wrangler.toml
```

Sanity: command exits 0 and the migration list remains Applied.  
Failure path: use Phase 6 D1 migration rollback / fix migration procedure.  
Evidence: TBD at execution.

## Step 6: secrets check

```bash
bash scripts/cf.sh secret list --env production --config apps/api/wrangler.toml
bash scripts/cf.sh pages secret list --project-name ubm-hyogo-web
```

Expected secret names:

| Target | Names |
| --- | --- |
| API production | `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_FORM_ID`, `MAIL_PROVIDER_KEY` |
| Web production | `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` |

Sanity: names are present; values are never printed.  
Evidence: TBD at execution.

## Step 7: API worker deploy

```bash
pnpm --filter @ubm/api deploy:production
```

Sanity: exit 0 and deployment target is `ubm-hyogo-api`.  
Evidence: TBD at execution.

## Step 8: Web deploy

```bash
pnpm --filter @ubm/web deploy:production
```

Sanity: exit 0 and deployment target is `ubm-hyogo-web`.  
Evidence: TBD at execution.

## Step 9: 10 route smoke

```bash
PRODUCTION_API="https://ubm-hyogo-api.<account>.workers.dev"
PRODUCTION_WEB="https://ubm-hyogo-web.pages.dev"
curl -sI "${PRODUCTION_WEB}/" | head -1
curl -sI "${PRODUCTION_WEB}/members" | head -1
curl -sI "${PRODUCTION_WEB}/members/sample-id" | head -1
curl -sI "${PRODUCTION_WEB}/login" | head -1
curl -sI "${PRODUCTION_WEB}/profile" | head -1
curl -sI "${PRODUCTION_WEB}/admin" | head -1
curl -sI "${PRODUCTION_WEB}/admin/members" | head -1
curl -sI "${PRODUCTION_WEB}/admin/tags" | head -1
curl -sI "${PRODUCTION_WEB}/admin/schema" | head -1
curl -sI "${PRODUCTION_WEB}/admin/meetings" | head -1
```

Sanity: public routes and `/login` respond as expected; protected routes redirect or enforce authorization. Browser smoke must confirm `/profile` and admin member body edit forms are absent.  
Evidence: TBD at execution.

## Step 10: manual sync trigger

```bash
COOKIE='__Secure-authjs.session-token=<redacted>'
curl -X POST "${PRODUCTION_API}/admin/sync/schema" -H "Cookie: ${COOKIE}" -H "Content-Type: application/json"
curl -X POST "${PRODUCTION_API}/admin/sync/responses" -H "Cookie: ${COOKIE}" -H "Content-Type: application/json"
bash scripts/cf.sh d1 execute ubm_hyogo_production \
  --command "SELECT id, type, status, started_at, finished_at FROM sync_jobs ORDER BY started_at DESC LIMIT 2;" \
  --remote --env production --config apps/api/wrangler.toml
```

Sanity: both sync jobs record `success`. Redact cookies.  
Evidence: TBD at execution.

## Step 11: release tag

Use `outputs/phase-05/release-tag-script.md`.

Sanity: local and remote tag exist and point to the intended main commit.  
Evidence: TBD at execution.

## Step 12: incident response runbook share

Share the 09b incident response runbook through the approved Slack / Email path and record:

- sent timestamp
- channel or recipient
- runbook URL
- release tag
- production URLs
- receipt confirmation

Evidence: `outputs/phase-11/share-evidence.md`, TBD at execution.

## Step 13: 24h post-release verify

After the observation window, record Cloudflare Workers requests, D1 reads/writes, bundle D1 scan, and attendance duplicate SQL results.

```bash
rg "D1Database" apps/web/.vercel/output/ || echo "no D1 import in web bundle: PASS"
bash scripts/cf.sh d1 execute ubm_hyogo_production \
  --command "SELECT session_id, member_id, COUNT(*) c FROM attendances WHERE deleted_at IS NULL GROUP BY session_id, member_id HAVING c > 1;" \
  --remote --env production --config apps/api/wrangler.toml
```

Sanity: metrics and SQL results satisfy the AC thresholds.  
Evidence: TBD at execution; do not mark PASS before runtime evidence exists.
