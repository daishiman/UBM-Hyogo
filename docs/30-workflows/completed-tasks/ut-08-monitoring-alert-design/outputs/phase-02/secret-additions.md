# UT-08 Phase 2: 追加 Secret 一覧 (AC-11)

| 項目 | 値 |
| --- | --- |
| 対応 AC | AC-11 |
| 親ドキュメント | [monitoring-design.md](./monitoring-design.md) |
| 不変条件 | アラート用 Secret は 1Password Environments で管理、コードへハードコードしない（不変条件 4） |

UT-08 で新規追加する Secret / 設定値の一覧。1Password Environments を正本とし、Cloudflare Secrets / GitHub Variables への展開ルートを併記する。

---

## 1. 追加 Secret 一覧

| 名前 | 種別 | 用途 | 正本 | 配置先 | 環境別 |
| --- | --- | --- | --- | --- | --- |
| `MONITORING_SLACK_WEBHOOK_URL_PROD` | Secret | 本番 Slack `#alerts-prod` 通知 | 1Password Environments | Cloudflare Secrets (production) | production のみ |
| `MONITORING_SLACK_WEBHOOK_URL_STAGING` | Secret | ステージング Slack `#alerts-staging` 通知 | 1Password Environments | Cloudflare Secrets (staging) | staging のみ |
| `MONITORING_SLACK_WEBHOOK_URL_DEPLOY` | Secret（任意） | デプロイ通知用 Slack `#alerts-deploy` | 1Password Environments | GitHub Secrets（CI で参照） | 全環境共通 |
| `UPTIMEROBOT_API_KEY` | Secret（任意） | UptimeRobot Monitor を IaC 管理する場合のみ | 1Password Environments | GitHub Secrets（CI でのみ） | 全環境共通 |
| `CLOUDFLARE_ANALYTICS_TOKEN` | Secret | GraphQL Analytics API 呼び出し（アラートワーカー用） | 1Password Environments | Cloudflare Secrets (production / staging) | 環境別 |
| `ALERT_EMAIL_TO` | 非機密 | バックアップ通知先メールアドレス | GitHub Variables | wrangler.toml `[vars]` または GitHub Variables | 環境別（任意） |
| `ALERT_EMAIL_FROM` | 非機密 | Cloudflare Email Routing 由来の送信元 | GitHub Variables | wrangler.toml `[vars]` | 環境別（任意） |

---

## 2. 1Password Environments 構造

```
UBM-Hyogo (vault)
└── Environments/
    ├── production/
    │   ├── MONITORING_SLACK_WEBHOOK_URL_PROD
    │   ├── CLOUDFLARE_ANALYTICS_TOKEN
    │   └── (ALERT_EMAIL_TO は非機密のため GitHub Variables 側)
    ├── staging/
    │   ├── MONITORING_SLACK_WEBHOOK_URL_STAGING
    │   └── CLOUDFLARE_ANALYTICS_TOKEN
    └── shared/
        ├── MONITORING_SLACK_WEBHOOK_URL_DEPLOY
        └── UPTIMEROBOT_API_KEY  (任意)
```

各 item には以下のメタを付与:

- title（Secret 名と同一）
- value（実値）
- notes（用途 / 発行日 / 次回ローテーション目安）
- url（Slack ワークスペース管理画面 / UptimeRobot 等）

---

## 3. Cloudflare Secrets への配置手順

### 本番

```bash
# 1Password CLI 経由（推奨、値が画面に出ない）
op read "op://UBM-Hyogo/MONITORING_SLACK_WEBHOOK_URL_PROD/value" \
  | wrangler secret put MONITORING_SLACK_WEBHOOK_URL_PROD --env production

op read "op://UBM-Hyogo/CLOUDFLARE_ANALYTICS_TOKEN/value" \
  | wrangler secret put CLOUDFLARE_ANALYTICS_TOKEN --env production
```

### ステージング

```bash
op read "op://UBM-Hyogo/MONITORING_SLACK_WEBHOOK_URL_STAGING/value" \
  | wrangler secret put MONITORING_SLACK_WEBHOOK_URL_STAGING --env staging
```

実行は Wave 2 実装タスクの「Secret 投入」ステップで行う。本タスクは設計のみ（不変条件 5）。

---

## 4. GitHub Secrets / Variables への配置手順

### Secrets（CI で参照）

```bash
gh secret set MONITORING_SLACK_WEBHOOK_URL_DEPLOY --body "$(op read 'op://UBM-Hyogo/MONITORING_SLACK_WEBHOOK_URL_DEPLOY/value')"
gh secret set UPTIMEROBOT_API_KEY --body "$(op read 'op://UBM-Hyogo/UPTIMEROBOT_API_KEY/value')"
```

### Variables（非機密）

```bash
gh variable set ALERT_EMAIL_TO --body "alerts@example.com"
gh variable set ALERT_EMAIL_FROM --body "noreply@<production-domain>"
```

---

## 5. ローカル開発（`.dev.vars`）

`apps/api/.dev.vars`（`.gitignore` 済）に手動でコピー:

```
MONITORING_SLACK_WEBHOOK_URL_STAGING=<staging value>
CLOUDFLARE_ANALYTICS_TOKEN=<staging value>
```

本番値はローカルに置かない。

---

## 6. ローテーション運用

| Secret | ローテーション頻度目安 | 手順 |
| --- | --- | --- |
| `MONITORING_SLACK_WEBHOOK_URL_*` | 漏洩時 / 180 日 | Slack で Revoke → 新発行 → 1Password 更新 → `wrangler secret put` 再実行（[runbook-diff-plan.md §3.2](./runbook-diff-plan.md)） |
| `UPTIMEROBOT_API_KEY` | 漏洩時 / 365 日 | UptimeRobot で Revoke → 新発行 → 1Password 更新 → GitHub Secrets 更新 |
| `CLOUDFLARE_ANALYTICS_TOKEN` | 漏洩時 / 180 日 | Cloudflare Dashboard で Revoke → 新発行 → 1Password 更新 → `wrangler secret put` |

ローテーション履歴は 1Password の change log に残す。

---

## 7. ハードコード禁止チェック

Phase 3 レビュー / Wave 2 実装の品質ゲートで以下を確認:

- [ ] リポジトリ内に Webhook URL の実値（`hooks.slack.com/services/...`）が grep で見つからない
- [ ] `wrangler.toml` の `[vars]` 直下に Secret 値が入っていない
- [ ] `.dev.vars.example`（あれば）にプレースホルダのみ記載され、実値は含まれていない
- [ ] PR diff で `MONITORING_SLACK_WEBHOOK_URL` をテキスト検索しても定義行のみ

---

## 8. Secret 削除手順（撤退時）

外部監視ツール撤退や監視機能停止時:

```bash
wrangler secret delete MONITORING_SLACK_WEBHOOK_URL_PROD --env production
wrangler secret delete MONITORING_SLACK_WEBHOOK_URL_STAGING --env staging
gh secret delete MONITORING_SLACK_WEBHOOK_URL_DEPLOY
# 1Password 側は archive（即削除しない、監査証跡のため）
```
