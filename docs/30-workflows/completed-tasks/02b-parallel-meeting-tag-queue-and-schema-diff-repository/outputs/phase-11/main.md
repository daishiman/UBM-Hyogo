# Phase 11: 手動 smoke

このタスクは UI 実装を含まないため、視覚的検証は対象外。代わりに repository を Workers 環境で起動し health 経由で API が D1 に到達できることを確認する手動 smoke を定義する。

## smoke 手順
1. `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` 緑
2. `mise exec -- pnpm vitest run apps/api/src/repository` で 42 テスト緑
3. （ステージングで）wrangler dev 経由で `/healthz` 200
4. （ステージングで）`getLatestVersion` 経由クエリが D1 に到達（08a で正式テスト）

## 結果
- 1, 2: ローカル確認済み（緑）
- 3, 4: 後続 09a / 08a タスクで実行（本タスクではローカル単体まで）
