# Phase 2 / env-binding-design — outputs

[実装区分: 実装仕様書]

> **AC 紐付け**: AC-6

## 1. 追加する binding 一覧

`apps/api/src/env.ts` `Env` interface に以下 3 field を **optional** で追加する。
全 optional 化により、staging 投入前の production も含めて degradation gracefully（未設定なら skip）にする。

| field 名 | 型 | 区分 | 用途 |
| --- | --- | --- | --- |
| `SLACK_WEBHOOK_URL_HEALTHCHECK` | `string?` | secret | `#alerts-healthcheck` 専用 Slack Incoming Webhook URL |
| `HEALTHCHECK_FALLBACK_EMAIL` | `string?` | secret | Slack 失敗時の Resend 宛先メールアドレス |
| `RESEND_API_KEY` | `string?` | secret | Resend API Bearer token |

> 既存 `SLACK_WEBHOOK_URL` / `CF_WEBHOOK_AUTH_SECRET` / `CF_ALERT_DASHBOARD_URL` / `CF_ALERT_RUNBOOK_URL` は再利用し追加しない。

## 2. `apps/api/src/env.ts` パッチイメージ

`apps/api/src/env.ts:85-91` 直後に以下ブロックを挿入:

```typescript
  // UT-17-FU-003 — alert-relay 週次自動 healthcheck (Cron Triggers)
  // 1Password 正本 → Cloudflare Secrets（`bash scripts/cf.sh secret put` 経由）
  // 全て optional: 未設定時は runAlertRelayHealthcheck 内で skip / fallback する
  readonly SLACK_WEBHOOK_URL_HEALTHCHECK?: string;
  readonly HEALTHCHECK_FALLBACK_EMAIL?: string;
  readonly RESEND_API_KEY?: string;
```

## 3. 1Password 正本パス

| field | 1Password 参照 (`op://Vault/Item/Field`) |
| --- | --- |
| `SLACK_WEBHOOK_URL_HEALTHCHECK` | `op://UBM-Hyogo-Production/Slack-Healthcheck/webhook_url` |
| `HEALTHCHECK_FALLBACK_EMAIL` | `op://UBM-Hyogo-Production/UT-17-Healthcheck/fallback_email` |
| `RESEND_API_KEY` | `op://UBM-Hyogo-Production/Resend/api_key` |

staging は別 vault `UBM-Hyogo-Staging` 配下の同名 item を参照する。

## 4. Cloudflare Secrets 投入手順

```bash
# 認証確認（op + cloudflare）
bash scripts/cf.sh whoami

# production
bash scripts/cf.sh secret put SLACK_WEBHOOK_URL_HEALTHCHECK --config apps/api/wrangler.toml --env production
bash scripts/cf.sh secret put HEALTHCHECK_FALLBACK_EMAIL --config apps/api/wrangler.toml --env production
bash scripts/cf.sh secret put RESEND_API_KEY --config apps/api/wrangler.toml --env production

# staging
bash scripts/cf.sh secret put SLACK_WEBHOOK_URL_HEALTHCHECK --config apps/api/wrangler.toml --env staging
bash scripts/cf.sh secret put HEALTHCHECK_FALLBACK_EMAIL --config apps/api/wrangler.toml --env staging
bash scripts/cf.sh secret put RESEND_API_KEY --config apps/api/wrangler.toml --env staging
```

> `scripts/cf.sh` が `op run --env-file=.env` 経由で `CLOUDFLARE_API_TOKEN` 等を 1Password から動的注入するため、ユーザが実値を手入力する箇所は wrangler secret put のプロンプトのみ。プロンプト入力時は **1Password から値をコピペ** する運用。

## 5. `.dev.vars.example` の追記

local env sample（存在する場合）または対応する開発用 env サンプルに以下を追記:

```dotenv
# UT-17-FU-003 alert-relay 週次自動 healthcheck（local 開発時は空でよい）
SLACK_WEBHOOK_URL_HEALTHCHECK="op://UBM-Hyogo-Local/Slack-Healthcheck/webhook_url"
HEALTHCHECK_FALLBACK_EMAIL="op://UBM-Hyogo-Local/UT-17-Healthcheck/fallback_email"
RESEND_API_KEY="op://UBM-Hyogo-Local/Resend/api_key"
```

> `.env` / `.dev.vars` 自体に実値を書かない（CLAUDE.md「ローカル `.env` の運用ルール」遵守）。

## 6. `apps/api/wrangler.toml` `[vars]` への追記

本タスクは **secret のみ** を追加し、`[vars]` (公開 var) は追加しない。
ただし、設計意図を読み取れるようコメントを `[env.production.vars]` / `[env.staging.vars]` セクション末尾に追記する:

```toml
# UT-17-FU-003 — alert-relay 週次自動 healthcheck で利用する secret 群:
# - SLACK_WEBHOOK_URL_HEALTHCHECK (Slack channel #alerts-healthcheck 専用)
# - HEALTHCHECK_FALLBACK_EMAIL (Slack 失敗時の Resend 通知先)
# - RESEND_API_KEY (Resend API key)
# 投入: `bash scripts/cf.sh secret put <NAME> --config apps/api/wrangler.toml --env <ENV>`
```

## 7. 既存 binding との衝突チェック

| 既存 binding | 衝突 | 備考 |
| --- | --- | --- |
| `SLACK_WEBHOOK_URL` | なし | 名前空間が異なる。本番 alert 経路として継続使用 |
| `SLACK_WEBHOOK_INCIDENT` | なし | 09b-A observability 用、別目的 |
| `SLACK_AUDIT_INCIDENT_WEBHOOK_URL` | なし | 553 audit-correlation 用、別目的 |
| `MAIL_PROVIDER_KEY` | なし | 05b magic link mailer 用。本タスクで `RESEND_API_KEY` を新設するのは責務分離のため。将来統合可（Phase 3 で議論） |
| `MAIL_FROM_ADDRESS` | なし | 既存 var。本タスクでは送信元を Resend 所有ドメインに固定するため再利用しない |

> Phase 3 design-review で `MAIL_PROVIDER_KEY` と `RESEND_API_KEY` の統合可否を再評価する。
> 現状の判断: alert 系の secret は alert 系のみで管理した方が事故時の rotate が独立できるため分離維持を推奨。

## 8. 変更対象ファイル

| パス | 区分 | 概要 |
| --- | --- | --- |
| `apps/api/src/env.ts` | 編集 | `Env` interface に 3 field 追加 |
| `apps/api/wrangler.toml` | 編集（コメントのみ） | `[env.production.vars]` / `[env.staging.vars]` 末尾に secret 投入手順コメント |
| local env sample | 編集（存在する場合） | op 参照を 3 行追記 |

## 9. 検証コマンド

```bash
# 型チェック（Env interface 整合性）
mise exec -- pnpm typecheck

# secret 投入後の確認
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging | grep -E "SLACK_WEBHOOK_URL_HEALTHCHECK|HEALTHCHECK_FALLBACK_EMAIL|RESEND_API_KEY"
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env production | grep -E "SLACK_WEBHOOK_URL_HEALTHCHECK|HEALTHCHECK_FALLBACK_EMAIL|RESEND_API_KEY"
```

## 10. DoD

- [x] 追加 binding 3 件が全て optional / secret 区分で示されている
- [x] `apps/api/src/env.ts` のパッチ位置がコード行で示されている
- [x] 1Password 正本パスが production / staging 別に明示されている
- [x] `bash scripts/cf.sh secret put` 投入コマンドが env 別に示されている
- [x] 既存 binding との命名衝突がないことが確認されている
- [x] `MAIL_PROVIDER_KEY` との統合可否が Phase 3 申し送りとして記録されている
