---
phase: 10
title: Local Verification
workflow_id: ut-25-deriv-02-sa-key-expiry-monitoring
status: draft
---

# Phase 10: Local Verification — SA key 失効監視

[実装区分: 実装仕様書]

## 1. 前提

- Node 24.15.0 / pnpm 10.33.2 が `mise install` 済み
- 1Password CLI ログイン済み（`op signin`）
- `wrangler` 直接実行禁止。Cloudflare 系は **必ず `bash scripts/cf.sh ...` 経由**

## 2. ローカル検証コマンド列（順次実行）

```bash
# 依存と型・lint
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# api パッケージ全 spec
mise exec -- pnpm --filter @ubm/api test

# 新規 spec のみ集中実行（開発中の高速反復用）
mise exec -- pnpm --filter @ubm/api test sheets-auth-classifier
mise exec -- pnpm --filter @ubm/api test sheets-auth-logger
mise exec -- pnpm --filter @ubm/api test sheets-auth-healthcheck

# PR pre-flight 一括
bash scripts/verify-pr-ready.sh
```

## 3. wrangler.toml の cron 不変確認

```bash
grep -A3 '^crons' apps/api/wrangler.toml
# 期待: ["0 18 * * *", "*/15 * * * *", "*/5 * * * *"] のまま 3 本
```

## 4. staging dry-run（コード変更なし、検証手順のみ）

### 4.1 deploy

```bash
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
```

### 4.2 意図的失効による alert 発火確認

```bash
# 1. 現在の staging GOOGLE_SERVICE_ACCOUNT_JSON を別 secret name に退避（手動 console 操作 or 別 wrapper）
# 2. 無効な JSON を一時的に投入
bash scripts/cf.sh secret put GOOGLE_SERVICE_ACCOUNT_JSON --config apps/api/wrangler.toml --env staging
# 入力: {"type":"service_account","client_email":"invalid@example.com","private_key":"-----BEGIN PRIVATE KEY-----\nINVALID\n-----END PRIVATE KEY-----"}

# 3. 次の `*/15` cron 発火、または手動 trigger (cf.sh の dispatch 経路) で healthcheck を起動
# 4. Workers logs を観測
bash scripts/cf.sh tail --config apps/api/wrangler.toml --env staging
# 期待: { event: 'sheets.auth.failure', code: 'SHEETS_AUTH_401_KEY_INVALID' or 403, status: 401|403, ... }

# 5. alert-relay 経由で Slack / mail に通知が届くこと、payload に rollbackRunbookUrl が含まれることを確認

# 6. 元の SA key を再投入してリストア
bash scripts/cf.sh secret put GOOGLE_SERVICE_ACCOUNT_JSON --config apps/api/wrangler.toml --env staging
```

### 4.3 false positive 抑止確認

- 一時的に target spreadsheet ID を存在しない値に差し替え → 404 を観測 → `SHEETS_AUTH_OTHER` に分類され alert が**飛ばない**ことを確認
- すぐに元 ID に戻す

## 5. production roll-out（user 承認後のみ）

```bash
# PR merge 後
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production
# 24 時間、Workers logs / alert チャネルを観測。誤陽性なしを確認
```

## 6. 禁止事項

- `wrangler` を直接実行しない（`scripts/cf.sh` 経由のみ）
- `.env` の中身を `cat` / `Read` で表示しない
- production 環境への意図的失効テストはしない（staging のみ）
