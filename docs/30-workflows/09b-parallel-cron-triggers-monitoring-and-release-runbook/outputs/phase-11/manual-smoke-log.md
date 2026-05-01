# manual-smoke-log

NON_VISUAL タスクのため、screenshot ではなく「実行予定コマンド + 期待出力」をテンプレで記録する。実値は 09a / 09c の deploy 後に埋める。

## 1. cron triggers list（staging）

```bash
$ wrangler deployments list --config apps/api/wrangler.toml | head -3
# 期待出力:
# Created                Author          Source     Deployment ID
# 2026-04-26T..Z         ci@github       Upload     <deploy_id>
```

```text
# Cloudflare Dashboard:
- ANALYTICS_URL_API_STAGING の "Triggers" タブで以下 3 件を確認
  - 0 * * * *   (legacy Sheets sync)
  - */15 * * * * (response sync)
  - 0 18 * * *  (schema sync, 03:00 JST)
# docs-only / NON_VISUAL のため screenshot は取得しない
```

## 2. rollback 試走（staging worker）

```bash
# 直前 deploy id 取得
$ wrangler deployments list --config apps/api/wrangler.toml | head -5
# 期待: 最新 + 直前の 2 行以上が表示される

# rollback
$ bash scripts/cf.sh rollback <prev_id> --config apps/api/wrangler.toml
# 期待: rollback succeeded のメッセージ

# 確認
$ curl -sI https://ubm-hyogo-api-staging.<account>.workers.dev/public/stats | head -1
HTTP/2 200

# rollforward（最新に戻す）
$ bash scripts/cf.sh rollback <latest_id> --config apps/api/wrangler.toml
$ curl -sI https://ubm-hyogo-api-staging.<account>.workers.dev/public/stats | head -1
HTTP/2 200
```

## 3. sync_jobs（cron 起動後）

```bash
$ wrangler d1 execute ubm-hyogo-db-staging \
    --command "SELECT id, type, status, started_at FROM sync_jobs ORDER BY started_at DESC LIMIT 3;" \
    --config apps/api/wrangler.toml

# 期待出力（JSON）:
# [
#   {"id": 123, "type": "responses", "status": "success", "started_at": "2026-04-26T..."},
#   {"id": 122, "type": "responses", "status": "success", "started_at": "2026-04-26T..."},
#   {"id": 121, "type": "schema",    "status": "success", "started_at": "2026-04-26T..."}
# ]
```

## 4. attendance 整合性確認（不変条件 #15）

```bash
# 重複チェック
$ wrangler d1 execute ubm-hyogo-db-staging \
    --command "SELECT meeting_id, member_id, COUNT(*) c FROM member_attendance WHERE deleted_at IS NULL GROUP BY meeting_id, member_id HAVING c > 1;" \
    --config apps/api/wrangler.toml
# expected: 0 rows

# 削除済みメンバー除外
$ wrangler d1 execute ubm-hyogo-db-staging \
    --command "SELECT a.id FROM member_attendance a JOIN members m ON m.id = a.member_id WHERE m.deleted_at IS NOT NULL AND a.deleted_at IS NULL;" \
    --config apps/api/wrangler.toml
# expected: 0 rows
```

## 5. runbook 走破 checklist

### 5.1 cron-deployment-runbook 走破

- [ ] Step 1: wrangler.toml `[triggers]` 仕様確認（grep で 2 hit）
- [ ] Step 2: `wrangler deployments list` + Dashboard Triggers タブで cron 3 件表示
- [ ] Step 3: sync_jobs running 0 件確認
- [ ] Step 4: cron 一時停止（`crons = []` 再 deploy 後 dashboard 0 件）
- [ ] Step 5: cron 再開（次 `*/15` で sync_jobs に新規 row）
- [ ] Step 6: `POST /admin/sync/{schema,responses}` で手動 sync 成功

### 5.2 release-runbook 走破（Phase 12 完成版）

- [ ] § 3.1 go-live フロー 6 step 全て exit 0
- [ ] § 3.2 rollback 手順 worker / pages 走破
- [ ] § 3.3 cron 制御フロー 一時停止 / 再開
- [ ] § 3.4 dashboard URL 6 件全て click 可能（link-checklist と一致）
- [ ] § 4 連絡先 placeholder（Slack / Email）が `<placeholder>` 表記

### 5.3 incident-response-runbook 走破（Phase 12 完成版）

- [ ] § 1 重大度定義 P0/P1/P2 一覧
- [ ] § 2 initial response（5 / 30 / 60 分アクション）
- [ ] § 3 escalation matrix（重大度 × 対応者 × 通知先）
- [ ] § 4 cron 一時停止コマンドへの redirect
- [ ] § 5 影響範囲評価（dashboard + sync_jobs SELECT）
- [ ] § 6 mitigation 標準パターン
- [ ] § 7 postmortem template

## 6. NON_VISUAL 根拠の再掲

- 本タスクは spec_created で wrangler.toml / コードを変更しない
- 実測 screenshot を要求しない代わりに、本テンプレを 09a / 09c で埋めて runtime 実測の証跡とする
- 9c Phase 1 で本テンプレを起点に production runbook を実行する
