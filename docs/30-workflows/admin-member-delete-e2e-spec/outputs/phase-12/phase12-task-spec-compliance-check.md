# Phase 12 Task Spec Compliance Check

| # | check | result |
|---|-------|--------|
| 1 | 対象 spec 列挙 | PASS: `apps/web/playwright/tests/admin-member-delete.spec.ts` |
| 2 | 1行実行コマンド | PASS: `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test admin-member-delete.spec.ts --project=desktop-chromium` |
| 3 | 実行前提 | PASS: Chromium installed; existing Playwright config starts local dev server |
| 4 | un-skip 不変条件 | PASS: `test.skip` は cascade preview 1 件のみ |
| 5 | browser binary | PASS: `playwright install chromium` executed locally |
| 6 | dev server | PASS: `apps/web/playwright.config.ts` webServer |
| 7 | CI gate | RUNTIME_PENDING: `.github/workflows/e2e-tests.yml` は user-gated CI evidence |
| 8 | E2E coverage | RUNTIME_PENDING: coverage producer 未接続のため PASS 条件にしない |
| 9 | Phase 12 implementation guide 用語数 | PASS: 用語チェック 5 語 |
| 10 | root/output artifacts parity | PASS: `artifacts.json` と `outputs/artifacts.json` を同値同期 |
| 11 | audit linkage | PASS: audit test は delete POST 後に `/admin/audit?action=admin.member.deleted` を確認 |
| 12 | focused unit regression | PASS: `MembersClient.test.tsx` + `MemberDrawer.test.tsx` 18 tests |

Dirty-code gate PASS: expected `apps/web/playwright/tests/admin-member-delete.spec.ts`, `apps/web/src/lib/admin/server-fetch.ts`, `apps/web/playwright.config.ts`, `apps/web/src/components/admin/MemberDrawer.tsx`, `apps/web/src/components/admin/MembersClient.tsx`, `apps/web/src/components/admin/__tests__/MembersClient.test.tsx`.

Placeholder gate PASS: `TODO(stage-3)` 1 件のみ。
