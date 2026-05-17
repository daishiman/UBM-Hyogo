[実装区分: 実装仕様書]

# Phase 10: 最終レビュー

## 目的

issue #709 の受入条件 + 本タスク DoD（Phase 1 §6）を満たしているか最終確認する。

## 1. issue #709 受入条件チェック

| 項目 | 検証 | 結果記入欄 |
|------|------|------------|
| 承認済み surfaces 向けに focused Playwright visual spec を追加 | `full-visual.spec.ts` が 17 routes をカバー、`visual-routes.ts` が正本 | |
| `pnpm --filter @ubm-hyogo/web playwright test --project=chromium apps/web/playwright/tests/visual` を実行 | 既存 4 visual spec が PASS。**さらに** visual-full 3 project が PASS | |
| Screenshot evidence を owning workflow outputs に記録 | `outputs/phase-11/evidence/baseline-list.md` に 51 件の filename + sha256 | |
| Risk: baseline churn 抑制 | route list は `visual-routes.ts` で固定、review budget は本タスクの 51 件のみ | |
| Risk: baseline ownership | `apps/web/playwright/tests/visual-full/` を owner として明示 | |

## 2. 本タスク DoD チェック

| # | DoD 項目 | 結果記入欄 |
|---|---------|------------|
| 1 | snapshots dir に 51 PNG | |
| 2 | `playwright-visual-full.yml` PR trigger アクティブ（required check 化は後続 governance task） | |
| 3 | 2 連続 PASS | |
| 4 | typecheck / lint PASS | |
| 5 | matrix の Visual baseline 17/19 | |
| 6 | Phase 11 evidence に sha256 | |
| 7 | visual-full 3 viewport 実行ログ | |

## 3. 不変条件再確認

- task-18-fu 資産破壊なし: `git diff origin/dev...HEAD -- apps/web/playwright.config.ts apps/web/playwright/tests/visual-full/full-visual.spec.ts apps/web/playwright/fixtures/visual-routes.ts` が空（または比較的小規模な diff）
- W7 4 baseline (`apps/web/playwright/tests/visual/*.spec.ts`) に変更なし: 同上 git diff で確認

## 4. 残課題（後続タスク）

- dev / main branch protection への `playwright-visual-full / visual-full (chromium, desktop|tablet|mobile)` required check 統合 → `docs/30-workflows/unassigned-task/task-709-fu-branch-protection-required-check.md`

## 5. 成果物

- 本ファイル `phase-10-final-review.md`
