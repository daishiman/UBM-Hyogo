# Verification Report

Generated for Issue #621 apps/web test suffix rename.

| Check | Result |
| --- | --- |
| root artifacts.json exists | PASS |
| Phase 11 evidence exists | PASS |
| Phase 12 strict 7 files exists | PASS |
| rename-mapping.csv rows | PASS: 70 data rows + header |
| apps/web residual `.test.ts(x)` | PASS: 0 |
| apps/web `.spec.ts(x)` | PASS: 87 including existing Playwright/E2E specs |
| apps/web residual `.test-d.ts` | PASS: 0 |
| apps/web `.spec-d.ts` | PASS: 1 type-only spec |
| web test | PASS: 69 passed / 1 skipped files, 516 passed / 1 skipped tests |
| typecheck | PASS: `mise exec -- pnpm typecheck` exit 0 |
| lint | PASS: `mise exec -- pnpm lint` exit 0 |
| verify-design-tokens | PASS: 1 file / 9 tests |

4 conditions: 矛盾なし / 漏れなし / 整合性あり / 依存関係整合 all PASS after expanding scope from `apps/web/src` 53 files to `apps/web` Vitest 70 files and aligning the remaining type-only `.test-d.ts` suffix.
