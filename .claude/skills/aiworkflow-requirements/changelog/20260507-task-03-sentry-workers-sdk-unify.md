# 2026-05-07 task-03 Sentry Workers SDK Unify Spec Sync

`docs/30-workflows/task-03-w2-par-sentry-workers-sdk-unify/` を `implemented-local / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` として正本同期。

## Synced Facts

- Workers / Node SSR / Edge: `@sentry/cloudflare` via `apps/web/src/instrumentation.ts`
- Browser: `@sentry/nextjs` via `apps/web/src/instrumentation-client.ts`
- Web server DSN secret: `SENTRY_DSN_WEB`
- Env access: `apps/web/src/lib/env.ts` の `getEnv().SENTRY_DSN_WEB`
- 1Password canonical reference: `op://UBM-Hyogo/Sentry Web DSN (<env>)/dsn`
- Browser public var: `NEXT_PUBLIC_SENTRY_DSN`
- Local evidence: `pnpm --filter @ubm-hyogo/web exec tsc --noEmit` PASS、web Vitest 51 files / 420 tests PASS、`pnpm --filter @ubm-hyogo/web build:cloudflare` PASS、worker grep 0 hits。
- Runtime evidence pending: staging deploy、Sentry dashboard server/browser event capture は user approval 後。

## Updated Indexes

- `indexes/quick-reference.md`
- `indexes/resource-map.md`
- `references/task-workflow-active.md`
