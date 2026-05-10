# Phase 9 — CI/CD / 品質ゲート

## 1. ローカルゲート（実装後に必ず通す）

| # | コマンド | 期待 exit code |
|---|---------|---------------|
| 1 | `mise exec -- pnpm install` | 0 |
| 2 | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | 0 |
| 3 | `mise exec -- pnpm lint` | 0 |
| 4 | `mise exec -- pnpm --filter @ubm-hyogo/web test:e2e admin-identity-conflicts.spec.ts` | 0（6 PASS） |

## 2. CI gate

| gate | path filter | 期待 |
|------|-------------|------|
| Web typecheck | `apps/web/**` | PASS |
| Web lint | `apps/web/**` | PASS |
| Playwright E2E | `apps/web/playwright/tests/**` | 該当 spec 6/6 PASS |
| `verify-design-tokens` | spec 内 HEX / `bg-[#xxx]` 直書き 0 件 | PASS |

## 3. grep ベース drift gate（DoD §9 と整合）

| # | 検出パターン | 期待結果 |
|---|------------|---------|
| G1 | `grep -n "mergedMemberId" apps/web/playwright/tests/admin-identity-conflicts.spec.ts` | 0 hit |
| G2 | `grep -nE "test\.skip\|test\.fixme" apps/web/playwright/tests/admin-identity-conflicts.spec.ts` | 0 hit |
| G3 | `grep -nE "fetch\(\|http://" apps/web/playwright/tests/admin-identity-conflicts.spec.ts` | 0 hit（実 endpoint 直叩き禁止） |
| G4 | `grep -nE "bg-\[#\|text-\[#" apps/web/playwright/tests/admin-identity-conflicts.spec.ts` | 0 hit |

## 4. 失敗時の対応

| 失敗 gate | 一次対応 |
|-----------|---------|
| typecheck | shared schema import path / 型不整合確認 |
| lint | `pnpm lint --fix` 後、残違反のみ手修正 |
| E2E | `--debug` モードで該当 test を局所実行、mock URL pattern 確認 |
| zod parse 失敗 | shared schema と request body shape の drift を確認 |
