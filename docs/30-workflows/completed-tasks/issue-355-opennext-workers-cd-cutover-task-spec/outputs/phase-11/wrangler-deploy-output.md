# Wrangler Deploy Output Evidence Contract

## Status

`PENDING_IMPLEMENTATION_FOLLOW_UP`

## Boundary

No Cloudflare mutation is performed in this workflow. This file reserves the canonical evidence path declared in `artifacts.json` and defines what the implementation follow-up must append after user-approved execution.

## Required Evidence On Execution

| Item | Required value |
| --- | --- |
| Build command | `pnpm --filter @ubm-hyogo/web build:cloudflare` |
| Deploy command | `wrangler deploy --env <staging|production>` through the project-approved wrapper when applicable |
| Output redaction | Account IDs, tokens, route secrets, and sink URLs must be redacted |
| NO-GO condition | `.open-next/worker.js` or `.open-next/assets` missing |

