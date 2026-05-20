# Phase 5: テスト計画

[実装区分: 実装仕様書]

## 1. テスト方針

production code 変更なしのため新規 unit/integration test は追加しない。本タスクの「テスト」は Playwright spec の **再現性 (deterministic) 確認** に限定する。

## 2. 検証マトリクス

| カテゴリ | 検証内容 | コマンド | PASS 条件 |
|---------|---------|---------|----------|
| Playwright spec | 8 pane test 完走 | `playwright test --config=playwright.admin-schema-diff.config.ts --grep "pane:"` | 8 passed / 0 failed |
| Playwright spec | resolve 3 状態完走 | `... --grep "resolve"` | 3 passed / 0 failed |
| 再現性 | 連続 2 回実行で差分なし | spec を 2 回実行し PNG hash diff | hash 一致 (toast timing 由来の差は許容) |
| Contract | 既存 contract spec が green を維持 | `pnpm vitest --run apps/api/src/routes/admin/schema.contract.spec.ts` | green |
| Type | typecheck | `mise exec -- pnpm typecheck` | exit 0 |
| Lint | lint | `mise exec -- pnpm lint` | exit 0 |
| Grep gate | local endpoint 焼き込み無し | `grep -rnE '127\.0\.0\.1:\|process\.env\.' apps/web/app/\(admin\)/admin/schema apps/web/src/lib/admin/server-fetch.ts` | 0 match |
| diff freeze | 不変ファイル変更 0 | `git diff dev...HEAD --name-only \| grep -E '<frozen list>'` | 0 line |

## 3. 不変ファイル diff チェック

```bash
FROZEN="apps/web/src/components/admin/SchemaDiffPanel.tsx
apps/web/src/lib/admin/api.ts
apps/web/src/lib/admin/server-fetch.ts
apps/api/src/routes/admin/schema.ts
apps/web/app/(admin)/admin/schema/page.tsx"

git diff dev...HEAD --name-only | grep -F "$FROZEN" && {
  echo "ERROR: frozen file modified"; exit 1
} || echo "OK: frozen files intact"
```

## 4. 再現性確認

1. clean state (`git stash` で work-in-progress 退避)
2. seed-cleanup → seed-diff 投入
3. spec 1 回目実行 → PNG hash 記録
4. spec 2 回目実行 → PNG hash 比較
5. hash 不一致時は `trace-on-first-retry` で原因切り分け（toast animation / fonts loading 等）

## 5. 失敗パターンと対処

| 失敗 | 原因候補 | 対処 |
|------|---------|------|
| 4 pane 全 fail | storageState 期限切れ | Phase 4 Step 6 を再実行 |
| `pane: added` のみ fail | seed SQL の added 条件が D1 に届いていない | `d1 execute --command "SELECT ..."` で確認、SQL 調整 |
| resolve 409 で別エラー | seed の collision key と spec input が不一致 | Phase 4 Step 2 seed と spec のキー値突合 |
| toast 待機 timeout | `getByRole('alert')` selector ズレ | `SchemaDiffPanel.tsx` の current aria roles 読み直して selector 調整 |
| desktop は OK / mobile fail | viewport で要素が overflow scroll | `panel.scrollIntoViewIfNeeded()` を spec に追加 |

## 6. 非対象

- E2E test の CI ジョブ化（task-22 別タスク）
- staging 環境での同 spec 実行（任意・Phase 10 runbook §3）
