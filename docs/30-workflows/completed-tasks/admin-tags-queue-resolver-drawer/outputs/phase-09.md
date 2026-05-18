# Phase 9 — ロールアウト戦略

## 環境別影響

| 環境 | 影響 |
| --- | --- |
| local | `pnpm dev` で `/admin/tags` を開いて drawer 動作確認可能 |
| staging (`dev` branch) | Cloudflare Workers preview。既存 D1 staging データに対し drawer 経由で resolve 可能。`admin.tag.queue_resolved` audit log は既存通り |
| production (`main` branch) | dev → main PR 後に deploy。drawer 経由でも従来 endpoint surface と同じ呼び出し |

## deploy 手順

1. feature branch `feat/admin-tags-queue-resolver-drawer` を `dev` へ PR（Phase 13 のユーザー承認後）
2. CI（`verify-design-tokens` / `playwright-smoke` / lint / typecheck）が green
3. dev へ merge → Cloudflare Workers staging に自動 deploy
4. staging で QA（V-7 playwright smoke を staging URL に対しても 1 度実行）
5. dev → main の release PR を別 wave で実施

## rollback

UI のみの差分のため `git revert` で即時 rollback 可能。D1 / API 変更が無いのでデータ rollback は不要。

```bash
git revert <merge-sha>
git push origin main
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production
```

## feature flag 不要根拠

- mutation 経路（endpoint）と body schema は変更なし
- UI structure 変更のみで業務ロジック差分なし
- 既存 testid と DOM semantics を維持しているため E2E 互換
- 失敗時は revert で即時復旧可能

故に feature flag は導入しない。
