# Phase 9 — QA (typecheck / lint / 全 test)

| gate | result |
|------|--------|
| `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | green |
| `mise exec -- pnpm --filter @ubm-hyogo/web lint` | green |
| `mise exec -- pnpm --filter @ubm-hyogo/web test` | 1163 passed / 1 skipped / 0 failed |
| `rg -n 'bg-\[#|text-\[#|border-\[#' apps/web/src/features/admin/components/_members apps/web/src/components/ui` | 検出 0 件 |
