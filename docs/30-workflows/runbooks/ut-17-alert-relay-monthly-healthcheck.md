# UT-17 Alert Relay 月次ヘルスチェック runbook

Cloudflare Notifications → 日本語化リレー Worker → Slack の通知経路が
**Webhook URL 失効 / Worker 障害 / Cloudflare 設定 drift** によってサイレント停止
していないことを月 1 回確認する手順。

## 1. 実施タイミング

- 毎月 1 日の業務開始前（朝イチ運用）
- インシデント対応後（postmortem の一部として）

## 2. 確認手順（5 ステップ）

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

### Step 4: Cloudflare Notification Policy drift 確認 (UT-17-Followup-004 IaC 経由)

Dashboard 目視ではなく `infra/cloudflare-alerts/` 配下の IaC declaration と
Cloudflare 実状を `pnpm cf:alerts:diff` で機械比較する:

```bash
mise exec -- pnpm cf:alerts:diff
# = bash scripts/cf.sh alerts diff
# exit 0 + "no drift detected" → OK
# exit 2 + drift 一覧                       → 差分発生。下記いずれかで対応
```

drift 一覧が出た場合の対応:

- 一時的に閾値を変えていた / Cloudflare 側で手動編集していた
  → 何が正しいかを判断:
    - **IaC が正** なら `bash scripts/cf.sh alerts apply --yes` で再収束 (要 1Password apply token)
    - **現状が正** なら `infra/cloudflare-alerts/policies/*.json` または `quota-base.json` を更新して PR (CI drift workflow が PR で再確認)
- 新規 policy がダッシュボードで足されている (`extra`)
  → IaC に取り込むなら `infra/cloudflare-alerts/policies/<name>.json` を追加して PR
  → 不要なら Cloudflare Dashboard から削除

詳細: `infra/cloudflare-alerts/README.md` / `docs/30-workflows/ut-17-followup-004-cloudflare-notification-policy-iac/`

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
