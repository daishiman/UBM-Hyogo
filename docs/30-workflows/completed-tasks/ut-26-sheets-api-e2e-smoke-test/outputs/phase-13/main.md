# Phase 13 Main

## Status

blocked: commit / push / PR creation requires explicit user approval.

## Local Check

| Check | Status | Notes |
| --- | --- | --- |
| targeted API tests | done | `pnpm --filter @ubm-hyogo/api test -- apps/api/src/routes/admin/smoke-sheets.test.ts apps/api/src/jobs/sheets-fetcher.ts` |
| API typecheck | done | `pnpm --filter @ubm-hyogo/api typecheck` |
| live local smoke | pending | requires `.dev.vars` / real Google credentials |
| live staging smoke | pending | requires staging deploy and SA sharing |
| commit / push / PR | blocked | user approval required |

## PR Notes Source

- Re-link to closed issue #41; do not reopen or close it again.
- Mention that production returns 404 for `/admin/smoke/sheets`.
- Do not include Service Account JSON, bearer tokens, private keys, client emails, access tokens, or full spreadsheet IDs.
