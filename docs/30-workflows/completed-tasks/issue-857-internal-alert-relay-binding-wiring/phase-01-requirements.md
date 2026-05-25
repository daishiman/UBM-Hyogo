---
phase: 1
title: Requirements
workflow_id: issue-857-internal-alert-relay-binding-wiring
status: completed
---

# Phase 1: Requirements — internal alert relay binding 配線

[実装区分: 実装仕様書]

## 1. 目的

SA key 失効監視（親: UT-25-DERIV-02）の healthcheck が検出した Sheets API 401/403 を、`/internal/alert-relay` 経由で Slack / mail へ確実に通知できるようにする。作成時 baseline では `apps/api/wrangler.toml` に `API_INTERNAL_BASE_URL` が未登録のため、`postAlertRelay()` が常に no-op に落ちて alert が発火しない構造的欠落があった。本サイクルで production/staging の両 env vars に配線済み。

## 2. 現状の事実確認（現コード調査結果）

| # | 事実 | ソース |
| --- | --- | --- |
| F-1 | `runSheetsAuthHealthcheck` は `*/15 * * * *` cron 内で `ctx.waitUntil(...)` 配線済み | `apps/api/src/index.ts:472-473` |
| F-2 | `postAlertRelay()` は `env.API_INTERNAL_BASE_URL` が falsy のとき `console.error({ event: "sheets.auth.alert_relay_skipped", reason: "missing API_INTERNAL_BASE_URL or token" })` で return | `apps/api/src/scheduled/sheets-auth-healthcheck.ts:90-101` |
| F-3 | 送信 token は `env.INTERNAL_ALERT_TOKEN ?? env.CF_WEBHOOK_AUTH_SECRET` | `sheets-auth-healthcheck.ts:91` |
| F-4 | POST は header `cf-webhook-auth: <token>` で `${base}/internal/alert-relay` を叩く | `sheets-auth-healthcheck.ts:103-111` |
| F-5 | 受信側 middleware は `cf-webhook-auth` を **`CF_WEBHOOK_AUTH_SECRET` のみ**と照合し、不一致は 401・未設定は 500 | `apps/api/src/middleware/verify-cf-webhook-auth.ts:15-25` |
| F-6 | 作成時 baseline では `wrangler.toml` の `[env.production.vars]` / `[env.staging.vars]` に `API_INTERNAL_BASE_URL` が不在。本サイクルで両方に追加済み | `apps/api/wrangler.toml` / `outputs/phase-11/evidence/api-internal-base-url-grep.log` |
| F-7 | `env.ts` は `API_INTERNAL_BASE_URL?` / `INTERNAL_ALERT_TOKEN?` を optional 宣言 | `apps/api/src/env.ts:111-112` |
| F-8 | 各環境 `AUTH_URL` は自 Worker public URL（prod `https://api.ubm-hyogo.workers.dev` / staging `https://api-staging.ubm-hyogo.workers.dev`） | `wrangler.toml:53,96` |
| F-9 | alert-relay は `ALERT_DEDUP_KV.get()` を try/catch で囲み、KV 未 binding でも degrade して forward を継続 | `apps/api/src/routes/internal/alert-relay.ts` |

## 3. 機能要件（G-*）

| ID | 要件 |
| --- | --- |
| G-1 | `apps/api/wrangler.toml` `[env.production.vars]` に `API_INTERNAL_BASE_URL = "https://api.ubm-hyogo.workers.dev"` を追加する。 |
| G-2 | `apps/api/wrangler.toml` `[env.staging.vars]` に `API_INTERNAL_BASE_URL = "https://api-staging.ubm-hyogo.workers.dev"` を追加する。 |
| G-3 | `apps/api/src/env.ts:109-112` のコメントを更新し、(a) deploy-required（healthcheck alert に必須）、(b) token は `CF_WEBHOOK_AUTH_SECRET` fallback を正本とし `INTERNAL_ALERT_TOKEN` を別値で設定すると relay 401 になる旨を明記する。 |
| G-4 | config 回帰 guard test を新設し、`wrangler.toml` の 2 環境 vars に `API_INTERNAL_BASE_URL` が存在することを assert する（再 drift 防止）。 |
| G-5 | 既存 contract spec に「`INTERNAL_ALERT_TOKEN` 未設定 + `CF_WEBHOOK_AUTH_SECRET` 設定」時に alert-relay POST が正しい header / body で発火する fallback ケースを追加する。 |
| G-6 | `CF_WEBHOOK_AUTH_SECRET` の staging / production Secret name presence 確認手順を Phase 10 runbook に記述する（実投入は user-gated）。 |
| G-7 | 親ワークフロー `ut-25-deriv-02-sa-key-expiry-monitoring/index.md` の関連 issue 欄に本ワークフローへの逆参照を追記する。 |

## 4. 非機能要件（NFR-*）

| ID | 要件 |
| --- | --- |
| NFR-1 | vars 追加は 2 環境で parity を保つ（片方欠落で sibling 環境が静かに no-op になる事故を防ぐ）。 |
| NFR-2 | 機密値を vars に焼き込まない。`API_INTERNAL_BASE_URL` は非機密 URL のため vars 可。token 類は Secrets のみ。 |
| NFR-3 | 既存 endpoint surface / token 検証ロジックを変更しない（配線と回帰 guard のみ）。 |
| NFR-4 | config guard test は wrangler.toml を文字列 / TOML パースで読むのみとし、ネットワーク / Cloudflare API へアクセスしない（CI で決定論的に通る）。 |
| NFR-5 | healthcheck の self-call（自 Worker public URL への subrequest）は free plan subrequest 上限を侵さない（失効時のみ・10 分窓 dedup 前提）。 |

## 5. 不変条件（UNBREAKABLE）

1. 新規 `INTERNAL_ALERT_TOKEN` Secret を投入しない（現コードで 401 を誘発）。
2. `[vars]` は 2 named env 両方に書く（top-level 継承されない）。
3. Cloudflare CLI は `scripts/cf.sh` 経由のみ。`wrangler` 直接実行禁止。
4. テストは `*.spec.ts` のみ。
5. `crons` 配列を増やさない。
6. 既定 PR base は `dev`。

## 6. 命名規則（現コード分析）

| 対象 | 規則 | 例 |
| --- | --- | --- |
| wrangler.toml var 名 | `SCREAMING_SNAKE_CASE` | `API_INTERNAL_BASE_URL` / `AUTH_URL` |
| test ファイル | `<subject>.<kind>.spec.ts`（kebab-case 主語） | `sheets-auth-healthcheck.contract.spec.ts` |
| 構造化ログ event | `<domain>.<area>.<action>`（dot 区切り） | `sheets.auth.alert_relay_skipped` |
| env 型 field | `readonly NAME?: string`（optional は `?`） | `API_INTERNAL_BASE_URL?: string` |

新規 guard test 名は既存規則に従い `sheets-auth-healthcheck.binding.spec.ts` とする。

## 7. タスク分類

- **タスク種別**: implementation（config-wiring）/ NON_VISUAL
- **Phase 11**: スクリーンショット不要（UI/UX 変更なし）。証跡は typecheck / lint / vitest 結果 + staging tail ログ。
- **implementation_mode**: `new`（wrangler.toml への var 追加と guard test は新規実装）

## 8. 受け入れ条件サマリ

詳細は Phase 8 (DoD)。要点: 2 環境 vars に `API_INTERNAL_BASE_URL` 登録 → config guard test green → contract fallback ケース green → typecheck / lint pass → staging deploy 後 tail で `alert_relay_skipped` log が消える。
