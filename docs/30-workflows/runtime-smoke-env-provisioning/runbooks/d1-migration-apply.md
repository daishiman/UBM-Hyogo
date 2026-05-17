# runbook: D1 migration apply（staging / production）

## 目的

`apps/api` の D1 schema を staging / production の Cloudflare D1 に適用する。本タスクでは smoke が schema mismatch で fail しないことを担保する。

> 全手順 user-gated。`wrangler` 直接実行は禁止。必ず `bash scripts/cf.sh` 経由。

## 事前確認

- [ ] migration ファイルが `apps/api/migrations/*.sql` に commit 済み
- [ ] `apps/api/wrangler.toml` の `[[d1_databases]]` binding 名 / database_name が staging / production で正しい
- [ ] 1Password に `CLOUDFLARE_API_TOKEN` が `.env` の `op://...` 参照経由で注入できる
- [ ] backup（`d1 export`）を直前に取得（破壊的変更を含む場合は必須）

## 手順

### 1. backup（推奨）

```bash
# staging
bash scripts/cf.sh d1 export ubm-hyogo-db-staging --env staging \
  --output "backup/staging-$(date +%Y%m%d-%H%M%S).sql"

# production
bash scripts/cf.sh d1 export ubm-hyogo-db-prod --env production \
  --output "backup/prod-$(date +%Y%m%d-%H%M%S).sql"
```

`backup/` ディレクトリは `.gitignore` 配下。コミット禁止。

### 2. 未適用 migration の確認

```bash
# staging
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging

# production
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production
```

期待: 未適用 migration が列挙される

### 3. apply（staging 先行）

```bash
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging
```

`y` 確認プロンプトが出る場合は user 操作で承認。

### 4. staging smoke で疎通確認

```bash
gh workflow run runtime-smoke-staging.yml --ref dev
gh run list --workflow=runtime-smoke-staging.yml --limit 1
```

PASS 確認後に production へ進む。

### 5. apply（production）

```bash
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production
```

### 6. production smoke で疎通確認

```bash
gh workflow run runtime-smoke-production.yml --ref main
gh run list --workflow=runtime-smoke-production.yml --limit 1
```

## rollback

```bash
# 直前 backup から restore
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production \
  --file "backup/prod-<timestamp>.sql"
```

> D1 の point-in-time restore は Cloudflare ダッシュボード経由（user 操作）も可。

## トラブルシュート

| 症状 | 対応 |
|------|------|
| `Error: Could not authenticate` | `CLOUDFLARE_API_TOKEN` の op 参照を確認 |
| `Error: D1_ERROR: table already exists` | migration 履歴の不整合。`d1 migrations list` を確認、必要なら `_cf_d1_migrations` テーブルを点検 |
| migration が反映されない | binding 名 / env 指定の typo を確認。`d1 list` で database UUID を再確認 |

## 完了条件

- staging / production の双方で `d1 migrations list` の未適用が 0 件
- staging / production smoke が直近 run で PASS
- backup ファイルが backup/ 配下にあるが、commit はされていない
