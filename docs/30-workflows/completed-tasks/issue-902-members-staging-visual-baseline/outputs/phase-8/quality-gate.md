# Phase 8 — Quality Gate

## 1. Gate 一覧

| Gate | 条件 | 検証コマンド | 状態 |
|------|------|------------|------|
| typecheck | exit 0 | `mise exec -- pnpm typecheck` | pending（実装サイクル時に実行） |
| lint | exit 0 | `mise exec -- pnpm lint` | pending |
| PR pre-flight | exit 0 | `bash scripts/verify-pr-ready.sh` | pending |
| design token grep | HEX 直書き 0 件（spec 範囲） | `grep -RE "#[0-9a-fA-F]{3,8}" apps/web/playwright/tests/visual-staging/` | pending |
| env 直接参照 | `apps/web/src/` 配下に新規追加なし | `git diff --stat apps/web/src/` | pending（spec は src/ 配下ではないため自動的に N/A） |
| Playwright list | members-list / member-detail を含む 6 tests 列挙 | `pnpm --filter @ubm-hyogo/web exec playwright test --project=staging-visual --list` | pending |

## 2. CI gate

| job | 条件 |
|-----|------|
| `verify-indexes-up-to-date` | docs/30-workflows 追加で drift なし（topic-map / keywords） |
| `verify-gate-metadata` | `artifacts.json` zod schema 適合 |
| `verify-phase12-compliance` | canonical 9 headings + Phase 11 evidence 表 + workflow root 適合 |
| `staging-visual (chromium, 6 screens)` | diff < 5%（baseline commit 後） |

## 3. coverage

本タスクは Playwright visual only のためコード coverage 加算なし。`coverage-guard` への影響もなし（spec ファイルは coverage 対象外）。
