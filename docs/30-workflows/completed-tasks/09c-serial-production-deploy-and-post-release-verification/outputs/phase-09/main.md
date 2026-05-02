# Phase 9 Output: Quality Gate

Status: spec_created  
Runtime evidence: pending_user_approval

## Six-Axis Quality Gate

| Axis | Required check | Template result | Runtime evidence |
| --- | --- | --- | --- |
| Free-tier estimate | Workers < 5k req/day, D1 reads < 50k/day, writes < 10k/day. | spec_covered | TBD at execution |
| Secret hygiene | No plaintext secrets in repo/logs; secret list contains only expected names. | spec_covered | TBD at execution |
| Accessibility | 08b suite can run with `BASE_URL=${PRODUCTION_WEB}` and target WCAG AA violations 0. | spec_covered | TBD at execution |
| Quality guards | `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`. | spec_covered | TBD at execution |
| Rollback rehearsal | 09b procedures reviewed and production procedure placeholders available. | spec_covered | TBD at execution |
| Invariants | #5, #6, #10, #11, #15 checks listed. | spec_covered | TBD at execution |

## Free-Tier Estimate

| Metric | Limit | MVP threshold | Runtime result |
| --- | --- | --- | --- |
| Workers requests | 100k/day | < 5k/day | TBD at execution |
| D1 reads | 500k/day | < 50k/day | TBD at execution |
| D1 writes | 100k/day | < 10k/day | TBD at execution |
| Pages requests | not the gating cost item | monitor only | TBD at execution |

## Secret Hygiene Checklist

| Check | Command / method | Expected |
| --- | --- | --- |
| Repo plaintext scan | `git grep -n "AUTH_SECRET=\\|GOOGLE_PRIVATE_KEY=\\|MAIL_PROVIDER_KEY="` | 0 hits |
| Env ignored | `git check-ignore -v .env .env.production` | ignored |
| API secret names | `bash scripts/cf.sh secret list --env production --config apps/api/wrangler.toml` | 4 expected names only |
| Web secret names | `bash scripts/cf.sh pages secret list --project-name ubm-hyogo-web` | 3 expected names only |
| Runbook leak scan | `rg "AUTH_SECRET=[a-zA-Z0-9]" docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/` | 0 hits |

## Invariant Pre-Checks

| Invariant | Check | Runtime evidence |
| --- | --- | --- |
| #5 apps/web no direct D1 | `rg "D1Database\\|env\\.DB" apps/web/.vercel/output/` | TBD at execution |
| #6 GAS prototype not promoted | `rg -niw "GAS\\|onFormSubmit\\|Apps Script trigger" apps/api/src/ apps/web/src/` | TBD at execution |
| #10 free tier | 24h estimate and Cloudflare dashboard | TBD at execution |
| #11 admin cannot edit body | UI grep + production smoke | TBD at execution |
| #15 attendance duplicate prevention | unique-index/spec review plus post-release SQL | TBD at execution |
