# Phase 11: 手動 smoke テスト

## 注意

staging D1 環境への接続ができないため、vitest テスト結果を evidence として記録する。
実際の wrangler コマンドは staging デプロイ後に実施すること。

## vitest テスト結果（evidence として記録）

manual-evidence.md 参照

## 将来の smoke テスト手順（staging デプロイ後）

```bash
# 1. staging D1 にマイグレーション適用
wrangler d1 migrations apply ubm-hyogo-staging --remote

# 2. Worker を staging にデプロイ
wrangler deploy --env staging

# 3. API エンドポイントを curl で確認
curl https://api-staging.ubm-hyogo.workers.dev/healthz

# 4. D1 クエリ確認（wrangler d1 execute）
wrangler d1 execute ubm-hyogo-staging --remote --command "SELECT COUNT(*) FROM member_identities;"
```
