# Phase 2 / slack-channel-strategy — outputs

[実装区分: 実装仕様書]

> **AC 紐付け**: AC-7

## 1. 設計方針

healthcheck OK 通知が本番 alert channel を埋める運用ノイズを避けるため、**専用 Slack channel `#alerts-healthcheck`** を新設し、専用 Incoming Webhook URL を `SLACK_WEBHOOK_URL_HEALTHCHECK` secret として管理する。

未設定時は本番 `SLACK_WEBHOOK_URL` に fallback することで、Bootstrap 期間（Slack 側 channel 作成前）でも healthcheck 機能を起動可能にする。

## 2. channel 構成

| Slack channel | 用途 | Incoming Webhook URL secret |
| --- | --- | --- |
| `#alerts-cloudflare` (既存想定) | Cloudflare Notifications 本物アラート | `SLACK_WEBHOOK_URL` |
| `#alerts-incidents` (既存) | 09b-A observability incidents | `SLACK_WEBHOOK_INCIDENT` |
| `#alerts-audit` (既存) | 553 audit-correlation | `SLACK_AUDIT_INCIDENT_WEBHOOK_URL` |
| **`#alerts-healthcheck`** (新規) | **UT-17-FU-003 週次 healthcheck OK 通知 / Mail fallback 発火 log** | **`SLACK_WEBHOOK_URL_HEALTHCHECK`** |

## 3. 投稿先決定ロジック

`apps/api/src/scheduled/healthcheck.ts` 内で以下の優先順:

```typescript
const webhookUrl = env.SLACK_WEBHOOK_URL_HEALTHCHECK ?? env.SLACK_WEBHOOK_URL;
if (!webhookUrl) {
  return { status: "skipped", reason: "no_slack_webhook", policyId: payload.policy_id };
}
```

`createAlertRelayRoute` を `.fetch()` で呼ぶ際、env を override して `SLACK_WEBHOOK_URL` を上書きしたコピーを渡す:

```typescript
const scopedEnv = { ...env, SLACK_WEBHOOK_URL: webhookUrl };
const response = await relayApp.fetch(req, scopedEnv, ctx);
```

これにより、UT-17 リレー Worker 本体には改変なく、healthcheck 経由の Slack 投稿だけ専用 channel に向く。

## 4. 運用判断ガイド

| 状況 | 判断 |
| --- | --- |
| 月曜 03:00 JST 以降、`#alerts-healthcheck` に OK 投稿あり | 経路正常 |
| 月曜 03:00 JST 以降、`#alerts-healthcheck` に投稿なし | Worker 自体停止 / cron 不発火 / env 未設定の疑い → Cloudflare Logs を `grep ut17-healthcheck` で確認 |
| `#alerts-healthcheck` に投稿なし + 運用者宛 Resend Mail 到達 | Slack 経路のみ障害 → Slack Webhook URL 失効疑い |
| 2 週連続 OK 投稿なし + Mail 到達なし | cron 不発火 / Worker 障害 / Resend 障害 → 月次 runbook に切替 |

## 5. Slack channel 新設手順（Slack 側オペレーション）

> 本タスク Phase 4 以降の実装着手前に Slack admin 操作で実施する前提作業。本仕様書ではコード変更ではなく外部オペレーションのため手順のみ記録する。

1. Slack workspace で `#alerts-healthcheck` channel を private で新設
2. 主要運用者 (admin / on-call) を invite
3. App > "Incoming Webhooks" を該当 channel に追加し Webhook URL を取得
4. 1Password `UBM-Hyogo-Production/Slack-Healthcheck/webhook_url` に保存（staging も同様に別 vault）
5. `bash scripts/cf.sh secret put SLACK_WEBHOOK_URL_HEALTHCHECK --env production` で投入

## 6. Bootstrap 期間の挙動

Slack channel 作成 / Webhook 発行が完了する前に Phase 4 以降の実装を staging へ deploy した場合:

- `env.SLACK_WEBHOOK_URL_HEALTHCHECK` 未設定
- `env.SLACK_WEBHOOK_URL` 設定済（既存）
- → fallback により本番 `#alerts-cloudflare` へ healthcheck OK 投稿が流れる

この挙動は **意図的に許容** する。理由:
- healthcheck 機能の動作確認が channel 構築待ちでブロックされない
- 一時的なノイズ < 機能停止リスク

Slack channel が整い次第、`SLACK_WEBHOOK_URL_HEALTHCHECK` を投入することで自動的に分離される。

## 7. 月次 runbook 連携

`docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` の冒頭に Phase 4 以降で以下を追記する方針:

```markdown
## 役割分担（UT-17-FU-003 以降）

| 経路 | 担当 | 頻度 |
| --- | --- | --- |
| 定常死活確認 | Cloudflare Cron Triggers (週次 healthcheck) | 週 1 回 (月曜 UTC) |
| 詳細 deep-dive | 本 runbook (手動) | 四半期 1 回 + cron 連続失敗時 |

週次 cron が **2 週連続** で OK 通知なし、または Mail fallback も発火しなかった場合、
本 runbook を即座に実施し、Cloudflare Logs / Slack Webhook URL / Resend 設定の trace を行う。
```

> 実 runbook 編集は Phase 4 以降の実装サイクルで行う。本 Phase は方針のみ記録。

## 8. 変更対象ファイル

| パス | 区分 | 概要 |
| --- | --- | --- |
| `apps/api/src/scheduled/healthcheck.ts` | 新規 | `env.SLACK_WEBHOOK_URL_HEALTHCHECK ?? env.SLACK_WEBHOOK_URL` 優先順実装 |
| `apps/api/src/env.ts` | 編集 | `SLACK_WEBHOOK_URL_HEALTHCHECK?` 追加（`env-binding-design.md` 参照） |
| `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` | 編集（Phase 4 以降） | 役割分担セクション追記 |

## 9. 検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/api test src/scheduled/healthcheck.test.ts -t "channel_fallback"

# staging で channel 分離挙動を確認
# 1. SLACK_WEBHOOK_URL_HEALTHCHECK を未投入の状態で cron trigger → 本番 channel に届くことを確認
# 2. SLACK_WEBHOOK_URL_HEALTHCHECK を投入 → 専用 channel に届くことを確認
bash scripts/cf.sh secret put SLACK_WEBHOOK_URL_HEALTHCHECK --config apps/api/wrangler.toml --env staging
```

## 10. DoD

- [x] 専用 channel `#alerts-healthcheck` の新設方針が明文化されている
- [x] 投稿先決定ロジック（`?? fallback`）がコードレベルで示されている
- [x] env override (`scopedEnv`) による UT-17 本体への無侵襲性が示されている
- [x] Bootstrap 期間の意図的 fallback 許容が示されている
- [x] 月次 runbook 役割分担追記方針（AC-9）が示されている
- [x] T-08 (channel fallback テスト) との対応が示されている
