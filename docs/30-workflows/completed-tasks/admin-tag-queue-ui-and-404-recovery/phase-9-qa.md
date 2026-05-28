# Phase 9: QA

## 自動検証

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter web test -- TagQueuePanel AdminSectionErrorClient server-fetch
bash scripts/verify-pr-ready.sh
```

期待: 全部 green。`verify-pr-ready.sh` の `gate-metadata:validate` / `verify:phase12-compliance` / `indexes` drift も 0。

## 手動 QA

| 観点 | 手順 | 期待 |
|------|------|------|
| 正常系 | dev で正しい `INTERNAL_API_BASE_URL` で `/admin/tags` を開く | page-head + grid-2 + sticky 右ペイン + chip + avatar が描画 |
| filter | status filter chip を切り替える | URL `?status=...` が変わり SSR で絞込結果が再描画 |
| empty | `?status=rejected` 等該当 0 件 | EmptyState 表示 |
| resolved subsection | status=queued 表示時に resolved を 1 件以上含む | TAGGED 補足セクション表示 |
| 404 hint | `INTERNAL_API_BASE_URL` を意図的にゴミ値に切替 | `ADMIN_FETCH_404` ヒント文表示 + console.warn 出力 |
| 401 hint | session cookie を削除して再読込 | `ADMIN_FETCH_401` ヒント文表示 |

## a11y

- `pnpm --filter web exec playwright test --grep @axe` の admin route が green を維持
- 新規追加要素の `aria-label` / `role` 付与確認
