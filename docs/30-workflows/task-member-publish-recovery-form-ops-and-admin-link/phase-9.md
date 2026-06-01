# Phase 9: 品質保証（設計書）

## 共通課題（Task A/B）: sync endpoint 認証経路

Task B の調査で判明した横断的前提:

- sync 系 endpoint（`POST /admin/sync/responses`, `POST /admin/sync/responses?fullSync=true`, `POST /admin/sync/responses?fullSync=true-publish-state`）は `requireSyncAdmin`（Bearer `SYNC_ADMIN_TOKEN`）で保護される。
- 一方、web の admin catch-all proxy（`apps/web/app/api/admin/[...path]/route.ts`）は `x-internal-auth` と cookie は注入するが、`authorization` ヘッダはクライアント送信時のみ転送する。
- ブラウザは機密 `SYNC_ADMIN_TOKEN` を保持できないため、**素のクライアント fetch では sync 系 endpoint が 401 となり到達不能**。
- **解消策**: proxy（`route.ts`）で server-only に `SYNC_ADMIN_TOKEN` を `Authorization: Bearer` として注入し、`env.ts` に optional フィールド追加 + Cloudflare Secrets 注入。
- **集約方針**: この proxy 変更は Task B の仕様（§認証経路）に1箇所集約し、Task A はそれに依存する（A の仕様書にもクロスリファレンスを記載）。A/B どちらを先に実装しても、proxy 変更が両者の前提となる。

## 品質ゲート

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm lint            # verify:no-inline-style / verify-design-tokens 含む
mise exec -- pnpm --filter @ubm-hyogo/web test
```

OKLch トークン（HEX 直書き禁止）、外部リンク `rel="noopener noreferrer"`、`*.spec.{ts,tsx}` 命名を gate で担保。
