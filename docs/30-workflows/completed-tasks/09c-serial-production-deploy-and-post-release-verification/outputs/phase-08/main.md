# Phase 8 Output: DRY Review

Status: spec_created  
Runtime evidence: pending_user_approval

## Before / After

| Category | Before | After |
| --- | --- | --- |
| Environment wording | production / prod / 本番 mixed | `production` in operational identifiers |
| API URL | repeated literal URL | `${PRODUCTION_API}` |
| Web URL | repeated literal URL | `${PRODUCTION_WEB}` |
| D1 database | repeated literal name | `${PRODUCTION_D1}` |
| Analytics URLs | repeated dashboard URLs | `${ANALYTICS_URL_API_PRODUCTION}` / `${ANALYTICS_URL_D1_PRODUCTION}` |
| Sync endpoints | full URL per curl example | `${PRODUCTION_API}/admin/sync/schema` and `/responses` |
| Tag wording | release/version number mixed | `release tag` with `vYYYYMMDD-HHMM` |
| Runtime placeholders | TODO / TBD mixed | `TBD at execution` or `pending_user_approval` |

## Canonical Variables

| Variable | Value template |
| --- | --- |
| `PRODUCTION_API` | `https://ubm-hyogo-api.<account>.workers.dev` |
| `PRODUCTION_WEB` | `https://ubm-hyogo-web.pages.dev` |
| `PRODUCTION_D1` | `ubm_hyogo_production` |
| `PAGES_PRODUCTION` | `ubm-hyogo-web` |
| `ANALYTICS_URL_API_PRODUCTION` | `https://dash.cloudflare.com/<account>/workers/services/view/ubm-hyogo-api/production/analytics` |
| `ANALYTICS_URL_D1_PRODUCTION` | `https://dash.cloudflare.com/<account>/d1/databases/ubm_hyogo_production/metrics` |
| `RELEASE_TAG` | `v$(date +%Y%m%d-%H%M)` |

## Shared Snippet References

| Snippet | Source pattern | 09c usage |
| --- | --- | --- |
| `check-deploy-status` | 09a Phase 8 | API / web deploy sanity |
| `check-sync-jobs` | 09a Phase 8 | manual sync evidence |
| `check-free-tier` | 09a Phase 8 | 24h metric evidence |
| `check-d1-import-in-web` | 09a Phase 8 | invariant #5 |
| `check-rollback` | 09b Phase 8 | Worker / Pages rollback |
| `check-cron` | 09b Phase 8 | cron pause / resume |

## Release Tag Rule

```text
Pattern: ^v[0-9]{8}-[0-9]{4}$
Example: v20260426-1530
Overwrite: prohibited
Replacement: create a new tag with a new HHMM
```

## Audit Commands

These commands are intended for execution during the runtime workflow.

```bash
rg -niw "プロダクション|本番系|prod系|release番号|リリース番号" docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/
rg -niw "onFormSubmit|Apps Script trigger" docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/
```

Runtime result: TBD at execution.
