# Phase 11: Manual Test

実装サイクル完了後に取得する evidence の枠組み。実テストは task-C で実行。

## 取得 evidence 一覧

| ファイル | 内容 |
|----------|------|
| `outputs/phase-11/admin-tags-empty.png` | `/admin/tags?status=rejected` の EmptyState |
| `outputs/phase-11/admin-tags-items.png` | `/admin/tags` の items 描画 |
| `outputs/phase-11/manual-test-result.md` | 実行コマンド / 日時 / staging URL / commit SHA / 観測 |

## 実行手順

1. 実装サイクル（task-A / B）完了後、staging へデプロイ（user gate）
2. `pnpm --filter web exec playwright test --project=staging-visual-authenticated apps/web/playwright/tests/visual-staging-authenticated/admin-tags-authenticated.spec.ts`
3. spec が `outputs/phase-11/admin-tags-{empty,items}.png` を直接書き出すことを確認
4. `manual-test-result.md` を起票
