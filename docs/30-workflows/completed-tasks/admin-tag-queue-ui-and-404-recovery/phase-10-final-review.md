# Phase 10: Final Review

## レビュー観点

- [ ] 不変条件 #1〜#6（D1 直接アクセス禁止 / OKLch token / Server Component / 既存 contract / API 不変 / 既存 spec green）すべて満たす
- [ ] 新規 primitive ファイル 0、新規 `apps/api` 変更 0（または最小限の debug log のみ）
- [ ] HEX 直書き 0 件
- [ ] `data-testid="admin-tag-queue-list" / "admin-tag-review-panel"` 維持
- [ ] `aria-labelledby="tag-queue-h"` 維持
- [ ] Drawer 接続 contract 破壊なし

## 退避点（risk register）

| risk | mitigation |
|------|-----------|
| staging で実際に 404 を出している原因が `INTERNAL_API_BASE_URL` 設定 or 未デプロイの場合、コード変更だけでは解消しない | task-A の dev-only debug log + UI ヒントで原因特定を可能にし、運用側で env 設定 / 再デプロイを行う |
| 既存 Playwright spec が `<h1>タグキュー</h1>` を visible で検証している可能性 | `h1` は維持しつつ `className="sr-only"` で視覚的に隠す（プロトタイプは `eyebrow + h-page` を `PageHead` 内で表示）。spec が visible を assert していたら `getByRole("heading", { name: "タグキュー" })` に変更 |
| Avatar primitive が memberId 文字列入力に対応していない | 既存 Avatar の API を grep で確認、`name` prop を渡せない場合は memberId をそのまま渡せる props を使う or 一文字 fallback を inline 実装 |
