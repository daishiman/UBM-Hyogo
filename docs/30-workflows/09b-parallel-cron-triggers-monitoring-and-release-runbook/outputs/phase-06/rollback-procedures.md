# rollback-procedures

worker / pages / D1 migration / cron の 4 種について、production を主対象に rollback 手順をコピペ可能 command で固定する。staging も同手順を `--env` 抜きで適用可能。

## 共通前提

- `bash scripts/cf.sh` ラッパー経由（CLAUDE.md 準拠）
- 不変条件 #5: 本 runbook に `apps/web` 経由の D1 操作は記載しない
- 不変条件 #6: GAS apps script trigger を rollback 対象に含めない
- 不変条件 #15: 各 rollback 完了後、attendance 整合性 SQL を必ず実行

## A. Worker rollback（apps/api）

### 手順

```bash
# 1. 直前 deploy id 取得
wrangler deployments list --config apps/api/wrangler.toml --env production | head -10

# 2. rollback
bash scripts/cf.sh rollback <deploy_id> --config apps/api/wrangler.toml --env production

# 3. 確認
curl -sI https://ubm-hyogo-api.<account>.workers.dev/public/stats | head -1
# expected: HTTP/2 200
```

### sanity check

- `curl -sI` が 200
- Cloudflare Dashboard Workers → ubm-hyogo-api → Deployments で active が直前 deploy

### 注意

- rollback で cron 設定も直前バージョンに戻る。直前 deploy が cron なし版だった場合は wrangler.toml current facts で再 deploy
- wrangler.toml の修正自体は rollback では戻らない（コード bundle のみ rollback）

## B. Pages rollback（apps/web）

### 手順

```text
1. Cloudflare Dashboard を開く: https://dash.cloudflare.com/<account>/pages
2. ubm-hyogo-web (production) を選択
3. Deployments タブ
4. 直前の "successful" deploy 行
5. "..." メニュー → "Rollback to this deployment"
```

### sanity check

```bash
curl -sI https://ubm-hyogo-web.pages.dev/ | head -1
# expected: HTTP/2 200
```

- web URL が前バージョンの content を返す（visual diff は 09c smoke で確認）

### 注意

- production 環境の Pages 環境変数 / secret は rollback されない（手動管理）
- staging Pages は同じ Dashboard 操作で `ubm-hyogo-web-staging` を対象にする

## C. D1 migration rollback（緊急、後方互換 fix migration）

### 原則

- **直接 SQL `DROP TABLE` / `ALTER TABLE DROP COLUMN` は禁止**（spec/15-infrastructure-runbook.md 準拠）
- 後方互換の fix migration を新規作成して前進的に修正する

### 手順

```bash
# 1. 現在の migration 一覧確認
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production

# 2. 必要に応じてバックアップ
bash scripts/cf.sh d1 export ubm-hyogo-db-prod --env production --output backup-$(date +%Y%m%d-%H%M%S).sql

# 3. fix migration 作成
wrangler d1 migrations create ubm-hyogo-db-prod fix_<issue_summary> --config apps/api/wrangler.toml

# 4. fix migration 編集（IF NOT EXISTS / ADD COLUMN ... DEFAULT NULL / VIEW 再作成 等）
#   editor で apps/api/migrations/<timestamp>_fix_<issue_summary>.sql を編集

# 5. apply
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production

# 6. 確認
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production
# expected: fix migration が Applied
```

### sanity check

- `wrangler d1 migrations list` で fix が `Applied`
- `apps/api` smoke test（`curl /public/stats` 等）が 200 を返す

### 注意

- 直接 SQL を実行する誘惑があっても **必ず migration 経由**。rollback の rollback ができなくなるため
- 大きなデータ移行が必要な場合は backup → fix migration → 検証の順で

## D. Cron rollback / 一時停止

### D-1: 全 cron 一時停止

```toml
# apps/api/wrangler.toml の該当箇所
[triggers]
crons = []

[env.production.triggers]
crons = []
```

```bash
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production
```

### D-2: 部分停止（特定 cron のみ）

```toml
# 例: response sync のみ止める
[env.production.triggers]
crons = ["0 * * * *", "0 18 * * *"]
```

```bash
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production
```

### D-3: 再開

```toml
[env.production.triggers]
crons = ["0 * * * *", "0 18 * * *", "*/15 * * * *"]
```

```bash
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production
```

### sanity check

- 停止: Cloudflare Dashboard Triggers タブで該当 cron が消える、または `[]` 表示
- 再開: 次の周期で sync_jobs に新規 running が発生

## attendance 整合性確認（不変条件 #15）

各 rollback 後、必ず以下を実行する。

```bash
# 1. 重複チェック（meeting × member の重複が 0 件）
wrangler d1 execute ubm-hyogo-db-prod \
  --command "SELECT meeting_id, member_id, COUNT(*) c FROM member_attendance WHERE deleted_at IS NULL GROUP BY meeting_id, member_id HAVING c > 1;" \
  --config apps/api/wrangler.toml --env production
# expected: 0 rows

# 2. 削除済みメンバー除外（attendance に削除済みメンバーが残っていない）
wrangler d1 execute ubm-hyogo-db-prod \
  --command "SELECT a.id FROM member_attendance a JOIN members m ON m.id = a.member_id WHERE m.deleted_at IS NOT NULL AND a.deleted_at IS NULL;" \
  --config apps/api/wrangler.toml --env production
# expected: 0 rows
```

### 違反時 mitigation

- 重複検出 → 02c の重複削除 SQL（後方互換 fix migration として作成）で解消
- 削除済みメンバーの attendance 残存 → 同じく fix migration で `deleted_at = datetime('now')` を伝播

## まとめ表

| 種別 | 主コマンド | sanity | rollback の rollback |
| --- | --- | --- | --- |
| A Worker | `wrangler rollback <id>` | curl 200 | 別 deploy id で再 rollback |
| B Pages | Dashboard 操作 | curl 200 | Dashboard で別 deploy へ |
| C D1 | fix migration | migrations list で Applied | 別 fix migration で前進 |
| D Cron | `crons = []` 再 deploy | Dashboard Triggers 0 件 | `crons = [...]` 再 deploy |
