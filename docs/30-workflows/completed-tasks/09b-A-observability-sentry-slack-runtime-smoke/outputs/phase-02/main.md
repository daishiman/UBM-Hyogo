# Output Phase 2: 設計（確定）

## status

DESIGN_CONFIRMED / NOT_EXECUTED

## 1. 1Password item 設計（正本）

vault は既存運用に整合し、env 別に item を分離する。実値は本ファイルに記載しない。

| vault | item | field | 用途 | env |
| --- | --- | --- | --- | --- |
| `UBM-Hyogo` | `Sentry / API DSN (staging)` | `dsn` | Workers API 用 Sentry DSN | staging |
| `UBM-Hyogo` | `Sentry / API DSN (production)` | `dsn` | Workers API 用 Sentry DSN | production |
| `UBM-Hyogo` | `Sentry / Web DSN (staging)` | `dsn` | Workers Web (Next.js) 用 Sentry DSN | staging |
| `UBM-Hyogo` | `Sentry / Web DSN (production)` | `dsn` | Workers Web 用 Sentry DSN | production |
| `UBM-Hyogo` | `Slack / Incident Webhook (staging)` | `url` | Incident channel webhook | staging |
| `UBM-Hyogo` | `Slack / Incident Webhook (production)` | `url` | Incident channel webhook | production |
| `UBM-Hyogo` | `Slack / Workflow Trigger (staging)` | `url` | Workflow Builder trigger（severity 分岐用、optional） | staging |
| `UBM-Hyogo` | `Slack / Workflow Trigger (production)` | `url` | Workflow Builder trigger | production |

op:// 参照例（実値読み出しは Phase 5 の `op read \| bash scripts/cf.sh secret put` のみ）:

- `op://UBM-Hyogo/Sentry · API DSN (staging)/dsn`
- `op://UBM-Hyogo/Slack · Incident Webhook (production)/url`

## 2. Cloudflare secret 命名表（正本）

`observability-monitoring.md` の `SLACK_ALERT_WEBHOOK_URL` 既存名と整合させ、本タスクで追加する secret は以下:

| secret 名 | 配置先 wrangler.toml | env | 1Password 参照 |
| --- | --- | --- | --- |
| `SENTRY_DSN_API` | `apps/api/wrangler.toml` | staging | `op://UBM-Hyogo/Sentry · API DSN (staging)/dsn` |
| `SENTRY_DSN_API` | `apps/api/wrangler.toml` | production | `op://UBM-Hyogo/Sentry · API DSN (production)/dsn` |
| `SENTRY_DSN_WEB` | `apps/web/wrangler.toml` | staging | `op://UBM-Hyogo/Sentry · Web DSN (staging)/dsn` |
| `SENTRY_DSN_WEB` | `apps/web/wrangler.toml` | production | `op://UBM-Hyogo/Sentry · Web DSN (production)/dsn` |
| `SLACK_WEBHOOK_INCIDENT` | `apps/api/wrangler.toml` | staging / production | `op://UBM-Hyogo/Slack · Incident Webhook (<env>)/url` |
| `SLACK_WORKFLOW_URL` (optional) | `apps/api/wrangler.toml` | staging / production | `op://UBM-Hyogo/Slack · Workflow Trigger (<env>)/url` |

注: 既存 `SLACK_ALERT_WEBHOOK_URL` を使用する path がある場合は、本タスク内で `SLACK_WEBHOOK_INCIDENT` への移行 / alias を Phase 5 で確定する（既存 reference の互換維持を優先）。

## 3. environment binding 表（wrangler.toml 追記必要箇所）

実値は wrangler.toml に書かず、`scripts/cf.sh secret put` で投入する。wrangler.toml には secret として参照宣言のみ（Cloudflare Workers の `[env.<env>] secrets =` ではなく実体は CF Dashboard / API 上）。

| ファイル | 追記内容 | env |
| --- | --- | --- |
| `apps/api/wrangler.toml` | `[vars]` には書かない。secret は `scripts/cf.sh secret put SENTRY_DSN_API --env <env>` で配置 | staging / production |
| `apps/api/wrangler.toml` | 同上 `SLACK_WEBHOOK_INCIDENT` | staging / production |
| `apps/web/wrangler.toml` | `scripts/cf.sh secret put SENTRY_DSN_WEB --env <env>` | staging / production |

注: コードからは `env.SENTRY_DSN_API` / `env.SLACK_WEBHOOK_INCIDENT` 等で参照。本タスクではコード変更を行わず、Phase 5 で Sentry SDK 初期化箇所と Slack notifier ラッパーの参照名のみ確定する。

## 4. Sentry test event 仕様

| 項目 | 仕様 |
| --- | --- |
| 送信手段 | (a) staging deploy 後に `apps/api` の test endpoint で `Sentry.captureMessage('UBM staging smoke ' + ISO8601)` を実行、または (b) curl で envelope POST。SDK 経由を優先 |
| 送信内容 | message のみ。stack trace / user PII / form 回答 / Magic Link を含めない |
| 確認画面 | Sentry project → Issues → 新規 issue として該当 event id を取得 |
| redact ルール | evidence には event id（短縮 hex）と timestamp のみ記録。DSN URL は `***` mask |
| 期待 latency | 送信から Sentry 受信まで 60 秒以内（free-tier 想定） |

## 5. Slack 通知 matrix

| trigger | severity | dedupe window | suppress 条件 | channel | source |
| --- | --- | --- | --- | --- | --- |
| `sync_jobs.failed` 連続 3 回 | P2 | 30min | first-occurrence は通知、再発は 30min 後 | `#ubm-incident` | apps/api cron handler |
| `sync_jobs.running` 30min 超（stale） | P2 | 60min | 同一 job_id は 60min 内 1 回 | `#ubm-incident` | apps/api watchdog |
| Workers 5xx rate > 5%（5min 窓） | P1 | 15min | 連続 fire は 15min dedupe | `#ubm-incident` | Cloudflare Analytics + cron evaluator |
| Sentry event の P1 tag 受信 | P1 | 15min | 同一 issue fingerprint は 15min | `#ubm-incident` | Sentry → Slack 連携（Phase 5 検討） |
| Magic Link 送信 provider 連続失敗 5 回 | P2 | 60min | provider rate-limit 由来は除外 | `#ubm-incident` | apps/api auth notifier |

## 6. rollback / rotation 手順設計

### 6.1 secret rollback

1. `bash scripts/cf.sh secret delete <SECRET_NAME> --config <wrangler.toml> --env <env>`
2. 1Password の旧 revision を確認
3. `op read 'op://...' | bash scripts/cf.sh secret put <SECRET_NAME> --config <wrangler.toml> --env <env>`
4. 旧 revision 投入後、AC-01 / AC-02 と同じ smoke を再実行

### 6.2 Sentry DSN rotation

- 即時 rotation 条件: DSN URL が docs / log / PR / chat に出力された／第三者が閲覧した可能性
- 手順: Sentry project → Client Keys → Generate New Key → 1Password 更新 → Cloudflare secret put → 旧 key を Disable
- evidence: rotation 完了 timestamp と新 key の id（値は記録しない）

### 6.3 Slack webhook revoke

- 即時 revoke 条件: webhook URL が docs / log / PR に出力された
- 手順: Slack App / Incoming Webhook 管理画面で対象 webhook を delete → 新 webhook 発行 → 1Password 更新 → Cloudflare secret put

## 7. 失敗時 fallback 判定 tree

```
[smoke 失敗 / 受信不可]
├── Sentry 受信失敗
│   ├── secret 配置エラー → cf.sh secret list で名前一致確認 → 6.1 rollback
│   ├── DSN 不正 / project 不一致 → 1Password item 名と env を再確認 → re-put
│   └── 受信遅延 60s 超 → 5min 待機後再送、改善しなければ Sentry status 確認 → 暫定 fallback: manual log 確認継続（INV #17 維持）
├── Slack 送信失敗
│   ├── 401 / invalid_payload → webhook URL revoke 疑い → 6.3 revoke
│   ├── rate_limited → dedupe window 拡張 + Phase 5 で抑制ルール再設計
│   └── channel 削除 → channel 復元 or 別 channel に migration、暫定 fallback: email 通知（既存 magic link provider 流用は不可、別経路を Phase 5 で検討）
└── secret 配置失敗
    ├── op read 失敗 → 1Password CLI 認証 / vault 権限を確認
    ├── cf.sh 認証失敗 → CLOUDFLARE_API_TOKEN の op:// 参照を再確認
    └── deploy 後に env 反映されない → wrangler.toml の env 設定とビルド対象 entry を Phase 5 で確認
```

## 8. 設計上の前提

- 本設計はコード変更を含まない。Phase 5 が wrangler.toml secret 名追加 / Sentry SDK 初期化 / Slack notifier ラッパー追加の実装計画を確定する
- 通知 matrix は staging smoke で全 trigger を発火させる必要はなく、AC-02 では最小 1 件（手動 test webhook 送信）で PASS とする
- production への secret 配置は AC-01 / AC-02 の staging smoke PASS 後の G-03 通過を前提とする
