# UT-08 Phase 2: 通知設計 (AC-3)

| 項目 | 値 |
| --- | --- |
| 対応 AC | AC-3 |
| 親ドキュメント | [monitoring-design.md](./monitoring-design.md) |
| 連携先 | [secret-additions.md](./secret-additions.md) |

メール / Slack Incoming Webhook の通知設計と Secret 取り扱い方針を定義する。本タスクでは通知基盤（UT-07）の実装本体を含まないため、Webhook URL を直接 Secret として保持する MVP 構成を採る。

---

## 1. 通知チャネル比較

| 観点 | Email | Slack Incoming Webhook |
| --- | --- | --- |
| 即時性 | 中（数秒〜数分） | 高（即時） |
| 履歴可視性 | 低（個人受信箱のみ） | 高（チャネル履歴 / 検索可） |
| 担当者の気付き | 中（メール埋もれ） | 高（モバイル通知） |
| 必要 Secret | SMTP 認証情報（複数） | Webhook URL 1 件 |
| 失敗時の代替 | 単独使用は脆弱 | サブにメールを置けば堅牢 |
| コスト | Cloudflare Email Routing 無料、SendGrid 無料枠等 | Slack 無料プランで Incoming Webhook 利用可 |
| 推奨用途 | バックアップ通知先（特に CRITICAL の月次累計系） | 一次通知先（全アラート） |

**結論**: 一次通知 = Slack Incoming Webhook、サブ通知 = Email。CRITICAL は両方に送る。

---

## 2. 通知マトリクス

| 通知タイプ | Slack | Email | 備考 |
| --- | --- | --- | --- |
| WARNING（初期運用） | ○ | × | アラート疲れ抑止のためメールは送らない |
| WARNING（安定運用後） | ○ | × | 同上 |
| CRITICAL | ○ | ○ | 担当者外出時の冗長確保 |
| 月次サマリ（無料枠消費） | ○ | ○ | 月初に自動配信（任意、Wave 2 で評価） |

---

## 3. Slack Incoming Webhook 設計

### 3.1 チャネル構成

| チャネル | 用途 | 通知レベル |
| --- | --- | --- |
| `#alerts-prod` | 本番監視通知 | WARNING / CRITICAL |
| `#alerts-staging` | ステージング監視通知 | WARNING のみ |
| `#alerts-deploy` | デプロイ失敗通知（任意） | Pages builds_failed |

各チャネルへ別々の Incoming Webhook を発行する。

### 3.2 Secret 名

- `MONITORING_SLACK_WEBHOOK_URL_PROD` （本番、`#alerts-prod`）
- `MONITORING_SLACK_WEBHOOK_URL_STAGING` （ステージング、`#alerts-staging`）
- `MONITORING_SLACK_WEBHOOK_URL_DEPLOY` （任意、`#alerts-deploy`）

詳細は [secret-additions.md](./secret-additions.md) を参照。

### 3.3 ペイロード仕様（推奨）

```json
{
  "text": "[CRITICAL] workers.errors_5xx 率 = 6.2% (window 5min, threshold 5%)",
  "attachments": [
    {
      "color": "danger",
      "fields": [
        { "title": "Service", "value": "apps/api (production)", "short": true },
        { "title": "Severity", "value": "CRITICAL", "short": true },
        { "title": "Runbook", "value": "<runbook URL>", "short": false }
      ]
    }
  ]
}
```

色分け: WARNING = `warning` (yellow), CRITICAL = `danger` (red)。

---

## 4. Email 通知設計

### 4.1 送信元の選択肢

| 送信方式 | 必要 Secret | 採否 |
| --- | --- | --- |
| Cloudflare Email Workers / Email Routing 受信転送 | なし（Cloudflare 内設定のみ） | サブ通知の有力候補 |
| SendGrid 無料プラン（100 件/日） | `SENDGRID_API_KEY` | 候補（無料枠十分） |
| AWS SES | AWS 認証情報複数 | 不採用（無料枠管理コスト過大） |
| Mailgun 無料プラン | `MAILGUN_API_KEY` | サブ候補 |

**MVP 推奨**: Cloudflare Email Routing 経由で `alerts@<domain>` から `ALERT_EMAIL_TO` へ転送。実装が簡素で追加 Secret 不要。

### 4.2 配送先

- `ALERT_EMAIL_TO`: GitHub Variables または `wrangler.toml` `[vars]` で管理（非機密のため Secret 化しない）
- 初期値は運用責任者の連絡先メール 1 件（個別管理）

---

## 5. Secret 取り扱い方針（不変条件 4）

| 項目 | 方針 |
| --- | --- |
| 正本配置 | 1Password Environments（`UBM-Hyogo / Cloudflare / monitoring`） |
| Cloudflare 配置 | `wrangler secret put MONITORING_SLACK_WEBHOOK_URL_PROD --env production` でランタイム注入 |
| ローカル開発 | `.dev.vars`（`.gitignore` 済）に手動コピー |
| ハードコード禁止 | コード / `wrangler.toml` 内に Webhook URL を直書きしない |
| ローテーション | 漏洩時は Slack 側で Webhook を Revoke → 新発行 → 1Password 更新 → `wrangler secret put` 再実行 |
| 監査 | アラート用 Secret は最小権限（Webhook URL のみ）。API トークン化されたものは使わない |

---

## 6. 通知発火元（Wave 2 実装イメージ）

本タスクは設計のみ。実装イメージとして Wave 2 で以下が想定される（実装範囲外）。

- WAE クエリ（GraphQL Analytics API）の Cron 結果から閾値超過時に Webhook fetch
- UptimeRobot は自身の通知機能で直接 Slack Webhook を呼び出し
- D1 / Workers のリアルタイム異常は `apps/api` 内で異常検知時に直接 Webhook fetch（極端なケースのみ）

詳細実装は Wave 2 タスクへ委譲。

---

## 7. 失敗時のフォールバック

- Slack 配送失敗（5xx）時 → Email へ自動フォールバック（実装は Wave 2）
- Email 配送失敗時 → Cloudflare Workers ログに記録、次回 WARNING で再通知
- 通知系全停止時 → 月次レビューで気付く（許容、MVP）
