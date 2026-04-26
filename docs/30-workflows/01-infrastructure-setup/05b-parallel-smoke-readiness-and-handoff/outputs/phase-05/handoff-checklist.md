# Phase 5 Handoff Checklist

## Handoff Summary

| Topic | Current fact | Owner action |
| --- | --- | --- |
| Web runtime | `apps/web` targets Cloudflare Workers through OpenNext | Keep `apps/web/open-next.config.ts` and `wrangler.toml` aligned |
| API runtime | API contracts target Cloudflare Workers / Hono | Keep shared types in `packages/shared` |
| Integration contracts | Runtime target is declared from shared foundation contracts | Keep `packages/integrations` importing shared contracts |
| Data source | Google Sheets is an upstream input, not the durable app ledger | Sync into D1 before user-facing workflows depend on it |
| D1 | D1 is the durable app store | Keep schema and migrations versioned |
| Secrets | No new secret is introduced by this docs-only task | Do not place secrets in task outputs |

## Before Implementation Starts

- Confirm the target branch and environment.
- Confirm Cloudflare project, D1 database, and GitHub environment names.
- Confirm that rollback owner and incident entrypoint are known.
- Confirm this task's Phase 12 outputs are present before PR drafting.
