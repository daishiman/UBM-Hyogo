# 2026-05-08 — Issue #560 Next Standalone Instrumentation Patch Implementation Sync

## Summary

Formalized and implemented Issue #560 task-03 follow-up 002 as `implemented-local / implementation / NON_VISUAL`.

## Canonical Facts

- Existing script: `scripts/patch-next-standalone-instrumentation.mjs`
- Current source artifact: `apps/web/.next/server/instrumentation.js`
- Current target artifact: `apps/web/.next/standalone/apps/web/.next/server/instrumentation.js`
- Correct package: `@ubm-hyogo/web`
- CI owner: `.github/workflows/pr-build-test.yml`
- Local regression: `node --test scripts/__tests__/patch-next-standalone-instrumentation.test.mjs`

## Boundary

No commit, push, PR, production deploy, or Sentry dashboard runtime evidence was performed.
