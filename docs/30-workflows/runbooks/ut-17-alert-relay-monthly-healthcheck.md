# UT-17 Alert Relay 月次ヘルスチェック runbook

Cloudflare Notifications → 日本語化リレー Worker → Slack の通知経路が
**Webhook URL 失効 / Worker 障害 / Cloudflare 設定 drift** によってサイレント停止
していないことを月 1 回確認する手順。

> **2026-05-14 更新**: 定常監視は UT-17-followup-003 の Cloudflare Workers cron healthcheck が担当する。
> この runbook は四半期の deep-dive、cron healthcheck 連続 2 回失敗時、インシデント対応後の手動確認に使う。

## 1. 実施タイミング

- 四半期初月 1 日の業務開始前（朝イチ運用）
- UT-17 weekly healthcheck が 2 回連続で失敗したとき
- インシデント対応後（postmortem の一部として）

## 2. 確認手順（5 ステップ + KV namespace 健全性）

### Step 1: テスト payload を staging に送信

```bash
op run --env-file=.env -- bash -c 'curl -i -X POST \
  "https://ubm-hyogo-api-staging.<account>.workers.dev/internal/alert-relay" \
  -H "cf-webhook-auth: $CF_WEBHOOK_AUTH_SECRET" \
  -H "content-type: application/json" \
  -d "{\"name\":\"UT-17 monthly healthcheck\",\"data\":{\"current\":1,\"threshold\":100},\"severity\":\"warning\"}"'
```

期待: `HTTP/1.1 200` / `{"ok":true,"attempts":1}`

### Step 2: Slack staging channel に到達確認

- 通知が日本語で届いている
- 「UT-17 monthly healthcheck」の文字列を含む
- ヘッダー絵文字 ⚠️ が表示されている

### Step 3: production 経路の生死確認（読み取りのみ）

```bash
op run --env-file=.env -- bash -c 'curl -i -X POST \
  "https://ubm-hyogo-api.<account>.workers.dev/internal/alert-relay" \
  -H "cf-webhook-auth: wrong-secret" \
  -H "content-type: application/json" \
  -d "{}"'
```

期待: `HTTP/1.1 401` （production が起動していて auth が効いている証跡）

### Step 4: Cloudflare Dashboard の Notification Policy drift 確認

Cloudflare Dashboard → Notifications で以下 4 種が **Active** であることを目視:

- Workers Daily Requests 80% / 95%
- D1 Read+Write Rows 80% / 95%
- Pages Build 80% / 95%
- R2 Class A 80% / 95%

destination が `https://ubm-hyogo-api.<account>.workers.dev/internal/alert-relay`
に紐付いていることを確認。

### Step 4b: ALERT_DEDUP_KV namespace 健全性確認（ut-17-followup-002）

dedup state は Cloudflare KV namespace `ALERT_DEDUP_KV`（binding 名）に永続化されている。
isolate 跨ぎ dedup が機能していることを確認する。

```bash
# binding が staging / production に正しく紐付いているか確認。
# namespace title は作成時の出力に従う。運用上の推奨 title は alert-dedup-staging / alert-dedup-production。
bash scripts/cf.sh kv:namespace list

# staging の dedup key を 1 件 list（任意。entry が無いか直近 5 分以内の entry のみであれば正常）
bash scripts/cf.sh kv:key list --binding ALERT_DEDUP_KV --env staging
```

期待:
- `kv:namespace list` 結果に、staging / production 用の実 namespace id と title（推奨: `alert-dedup-staging` / `alert-dedup-production`）が表示される
- staging key list で TTL 5 分超えの古い entry が残っていない（KV `expirationTtl` が機能している）
- 異常時: `apps/api/wrangler.toml` のコメント化済み `[[env.{staging,production}.kv_namespaces]]` block が実 namespace id で有効化されているか確認する。placeholder id を active TOML に置かない。

### Step 5: 1Password の secret 鮮度確認

- `op://Personal/cloudflare-alert-relay/SLACK_WEBHOOK_URL` の更新日が 90 日以上前なら Slack 側で再発行を検討
- `op://Personal/cloudflare-alert-relay/CF_WEBHOOK_AUTH_SECRET` も同様

## 3. 異常検知時の対応

| 症状 | 一次対応 |
| --- | --- |
| Step 1 が 401 | `cf-webhook-auth` secret が drift。1Password と Cloudflare Secrets を再同期 |
| Step 1 が 502 | Slack Webhook URL 失効。1Password を更新後 `bash scripts/cf.sh secret put SLACK_WEBHOOK_URL` で再投入 |
| Step 1 が 503 | `SLACK_WEBHOOK_URL` 未設定。Cloudflare Secrets に投入 |
| Step 2 で Slack 未到達 | Webhook URL の channel 紐付けを Slack 側で確認 |
| Step 4 で Policy が消失 | Dashboard で再作成 + UT-17 phase-04 task-breakdown を参照 |

## 4. 記録

実施結果は `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.log.md` を作成し、
実施日 / 担当 / Step 1〜5 の結果 / 異常時の対応を追記する（初回は本ファイルから派生作成）。
