# Phase 11: NON_VISUAL 手動テスト結果

## 代替証跡

| Evidence | Path / Command | Status |
|------|------|------|
| Unit test | `mise exec -- pnpm --filter @ubm-hyogo/web test -- security-headers` | PASS（runner は apps/web suite 全体を実行し 872 passed / 1 skipped） |
| Typecheck | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | PASS |
| Lint | `mise exec -- pnpm --filter @ubm-hyogo/web lint` | PASS |
| Build | `ENVIRONMENT=local NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8787 PUBLIC_API_BASE_URL=http://127.0.0.1:8787 INTERNAL_API_BASE_URL=http://127.0.0.1:8787 AUTH_URL=http://localhost:3000 SENTRY_ENVIRONMENT=local SENTRY_TRACES_SAMPLE_RATE=0 mise exec -- pnpm --filter @ubm-hyogo/web build` | PASS |
| Playwright smoke | `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3107 PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/apps-web-security-headers-hardening/outputs/phase-11/evidence mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/security-headers.spec.ts --project=desktop-chromium` | PASS（6 passed） |
| Grep guard | `rg -n "127\\.0\\.0\\.1:8888|browsing-topics|require-trusted-types-for" apps/web/src apps/web/middleware.ts -g '!*.spec.ts' -g '!**/__tests__/**'` | PASS（hit 0 / exit 1） |

## Phase 11 evidence file inventory

| Status | Path | 内容 |
|------|------|------|
| present | `apps/web/src/lib/security-headers.spec.ts` | deterministic unit evidence |
| present | `apps/web/playwright/tests/security-headers.spec.ts` | HTTP response smoke evidence |
| n/a | screenshots | NON_VISUAL のため不要 |
