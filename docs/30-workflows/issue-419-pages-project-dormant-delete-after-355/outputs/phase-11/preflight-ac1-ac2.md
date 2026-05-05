# Preflight AC-1 / AC-2

state: PENDING_RUNTIME_EXECUTION
date: -
operator: -
redaction: -
runtime_pass: PENDING
ac_link: AC-1, AC-2

## Required Runtime Evidence

| Check | Command | Result |
| --- | --- | --- |
| Cloudflare auth | `bash scripts/cf.sh whoami` | pending |
| Workers production deployment list | `bash scripts/cf.sh deployments list --config apps/web/wrangler.toml --env production` | pending |
| Pages project list | `bash scripts/cf.sh pages project list` | pending |
| Pages domain attachment detail | `bash scripts/cf.sh api-get /client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/pages/projects` | pending |

## PASS Criteria

- Workers production route is already cut over from Pages to Workers.
- Staging and production smoke evidence from the cutover cycle is linked or re-run.
- The dormant Pages project has no active custom domain attachment.
- The latest Pages deploy predates cutover and no new deploy is observed.
