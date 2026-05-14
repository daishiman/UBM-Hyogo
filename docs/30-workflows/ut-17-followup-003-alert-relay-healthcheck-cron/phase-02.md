# Phase 2: 設計

[実装区分: 実装仕様書]

> **実装区分判定根拠**: 本 Phase の成果物は新規モジュール `apps/api/src/scheduled/healthcheck.ts` と
> `apps/api/src/index.ts` `scheduled` handler 拡張・`apps/api/src/env.ts` interface 拡張のコード設計を含む。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-17-FU-003 alert-relay 週次自動 healthcheck (Cron Triggers) |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計 |
| 作成日 | 2026-05-14 |
| 担当 | delivery |
| 前 Phase | 1 (要件定義) |
| 次 Phase | 3 (設計レビュー) |
| 状態 | completed |

## 目的

Phase 1 で確定した 4 論点採用案 (cron 相乗り / Request 偽造方式 / 専用 channel / Resend) を、
コード実装可能な粒度の設計に落とし込む。本 Phase は以下 5 成果物を出力する。

1. `outputs/phase-02/cron-schedule-design.md` — 既存 cron への相乗り構造と曜日判定ロジック
2. `outputs/phase-02/scheduled-handler-design.md` — `healthcheck.ts` の関数シグネチャ・I/O・依存注入・Request 偽造
3. `outputs/phase-02/mail-fallback-design.md` — Resend API ペイロード・retry/timeout・テンプレート
4. `outputs/phase-02/env-binding-design.md` — `Env` 拡張 / Secret 投入手順 / 1Password パス
5. `outputs/phase-02/slack-channel-strategy.md` — `SLACK_WEBHOOK_URL_HEALTHCHECK` 戦略

## 変更対象ファイル一覧

| パス | 区分 | 概要 |
| --- | --- | --- |
| `apps/api/wrangler.toml` | 編集 | 既存 `crons` 3 本は不変。`[env.production.vars]` / `[env.staging.vars]` にコメントで healthcheck 相乗り意図を追記 |
| `apps/api/src/index.ts` | 編集 | `0 18 * * *` cron 分岐内に `runAlertRelayHealthcheck(env, ctx, event)` 呼び出しを追加（dayOfWeek=1 限定） |
| `apps/api/src/env.ts` | 編集 | `Env` interface に `SLACK_WEBHOOK_URL_HEALTHCHECK?`, `HEALTHCHECK_FALLBACK_EMAIL?`, `RESEND_API_KEY?` を追加 |
| `apps/api/src/scheduled/healthcheck.ts` | 新規 | `runAlertRelayHealthcheck` / `buildHealthcheckPayload` / `sendMailFallback` 関数群 |
| `apps/api/src/scheduled/healthcheck.test.ts` | 新規 | Vitest unit test（正常系・Slack 失敗→Mail fallback・dedupe 衝突・dayOfWeek 非月曜スキップ・env 未設定スキップ） |
| `apps/api/wrangler.toml` `[env.production.vars]` / `[env.staging.vars]` | 編集（コメントのみ） | 新 secret 投入位置を README コメントで明示 |
| `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` | 編集（Phase 4 以降想定） | 役割分担追記 — 設計方針のみ本 Phase で記録 |

> **alert-relay 本体は改変しない**。`createAlertRelayRoute` の Hono インスタンスを `.fetch()` で呼ぶのみ。

## 主要関数シグネチャ

```typescript
// apps/api/src/scheduled/healthcheck.ts

import type { ScheduledController, ExecutionContext } from "@cloudflare/workers-types";

export interface HealthcheckEnv {
  readonly CF_WEBHOOK_AUTH_SECRET?: string;
  readonly SLACK_WEBHOOK_URL?: string;
  readonly SLACK_WEBHOOK_URL_HEALTHCHECK?: string;
  readonly HEALTHCHECK_FALLBACK_EMAIL?: string;
  readonly RESEND_API_KEY?: string;
  readonly CF_ALERT_DASHBOARD_URL?: string;
  readonly CF_ALERT_RUNBOOK_URL?: string;
}

export interface HealthcheckDeps {
  readonly fetch?: typeof fetch;
  readonly now?: () => Date;
  readonly relayApp?: { fetch: (req: Request, env: unknown) => Promise<Response> };
}

export interface HealthcheckMailFallbackResult {
  readonly status: "ok" | "slack_failed" | "skipped" | "mail_fallback_sent" | "mail_fallback_failed";
  readonly slackStatus?: number;
  readonly slackBody?: string;
  readonly mailStatus?: number;
  readonly reason?: string;
}

/** dayOfWeek=1 (月曜) のみ起動する週次 healthcheck エントリポイント。 */
export async function runAlertRelayHealthcheck(
  env: HealthcheckEnv,
  ctx: ExecutionContext,
  event: ScheduledController,
  deps?: HealthcheckDeps,
): Promise<HealthcheckMailFallbackResult>;

/** healthcheck 用 Cloudflare Notifications 互換 payload を生成。 */
export function buildHealthcheckPayload(now: Date): {
  name: "UT-17 weekly healthcheck";
  severity: "info";
  alert_type: "ut17_healthcheck";
  policy_id: string; // "ut-17-weekly-healthcheck-2026W20" 形式
  ts: number;
  data: { healthcheck: true; isoWeek: string };
};

/** Resend API 経由で運用者宛にフォールバック通知を送信。 */
export async function sendMailFallback(
  env: HealthcheckEnv,
  reason: string,
  deps?: { fetch?: typeof fetch; now?: () => Date },
): Promise<{ ok: boolean; status?: number; body?: string }>;
```

## 入出力・副作用

- **入力**: `ScheduledController.cron`（外側でフィルタ済み `"0 18 * * *"`）、`ScheduledController.scheduledTime` (number, UTC ms)、`env`（D1 / Slack / Resend / dashboard URL）。
- **出力**: `HealthcheckMailFallbackResult`。`ctx.waitUntil` 経由なので caller は値を待たない。実体は構造化 log として `console.log` / `console.error` に emit。
- **副作用**:
  - Slack Incoming Webhook への POST 1 回（成功時）/ 最大 2 回（retry）
  - Resend API への POST 1 回（Slack 失敗時のみ）
  - `console.log("[ut17-healthcheck] result", result)` を必ず 1 回 emit
- **D1 アクセスなし**

## 動作シーケンス（正常系）

```
[cron event "0 18 * * *"]
  └─ apps/api/src/index.ts scheduled handler
       ├─ if dayOfWeek !== 1 → スキップ (既存処理だけ実行)
       └─ ctx.waitUntil(runAlertRelayHealthcheck(env, ctx, event))
            ├─ buildHealthcheckPayload(now) → payload
            ├─ Request 偽造 (cf-webhook-auth header + JSON body)
            ├─ relayApp.fetch(request, { ...env, SLACK_WEBHOOK_URL: healthcheckUrl }) ※ channel 分離
            ├─ alert-relay 内部処理 (verifyCfWebhookAuth → dedupe → formatter → sendSlackMessage)
            └─ result 200/{ok:true} → console.log({ status: "ok" })
```

異常系（Slack 失敗）:
```
... relayApp.fetch → status 502 / body にエラー
  └─ sendMailFallback(env, "slack_delivery_failed: status=502")
       ├─ POST https://api.resend.com/emails
       └─ { ok: true } → console.log({ status: "mail_fallback_sent" })
```

## テスト方針

### 追加テストファイル

`apps/api/src/scheduled/healthcheck.test.ts`（Vitest, Workers 互換）

### テストケース

| # | ケース | 期待結果 |
| --- | --- | --- |
| T-01 | dayOfWeek=1 / Slack 200 + body "ok" | result.status === "ok" |
| T-02 | dayOfWeek=2 (火曜) | result.status === "skipped" / fetch 0 回 |
| T-03 | dayOfWeek=1 / Slack 200 + body "no_service" | mail fallback 発火、result.status === "mail_fallback_sent" |
| T-04 | dayOfWeek=1 / Slack 500 / Resend 200 | result.status === "mail_fallback_sent" |
| T-05 | dayOfWeek=1 / Slack 500 / Resend 401 | result.status === "mail_fallback_failed" |
| T-06 | env.CF_WEBHOOK_AUTH_SECRET 未設定 | result.status === "skipped" / reason="auth_secret_missing" |
| T-07 | env.RESEND_API_KEY 未設定 / Slack 失敗 | result.status === "mail_fallback_failed" / reason="resend_key_missing" |
| T-08 | env.SLACK_WEBHOOK_URL_HEALTHCHECK 未設定 / SLACK_WEBHOOK_URL あり | 本番 URL に fallback、result.status === "ok" |
| T-09 | dayOfWeek=1 / `policy_id` が ISO 週番号を含む | payload.policy_id matches `/^ut-17-weekly-healthcheck-\d{4}W\d{2}$/` |
| T-10 | dayOfWeek=1 / 同週内 2 回目呼出 | dedupe 抑止が relay 内で発動 → result.status === "ok" / deduped log |

### モック方針

- `deps.fetch` を Vitest `vi.fn()` で差し替え、URL ごとに `Response` を返す
- `deps.now` を fixed Date で固定
- `deps.relayApp` を `{ fetch: vi.fn().mockResolvedValue(new Response(...)) }` で差し替えるオプションも提供（統合パスはデフォルト挙動を採用）

## ローカル実行・検証コマンド

```bash
# 型 / lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# unit test
mise exec -- pnpm --filter @ubm-hyogo/api test src/scheduled/healthcheck.test.ts

# wrangler 経由の cron テスト発火（staging で 1 回）
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
# Cloudflare Dashboard > Workers > ubm-hyogo-api-staging > Triggers > "Trigger Cron" で "0 18 * * *" を手動発火
# 月曜以外は dayOfWeek 判定でスキップする点に注意。テスト時は scheduled handler 内のガード式を
# 一時的に `true` でコメントアウトする手順を runbook に記載する（本番には絶対に持ち込まない）。

# Secret 投入（1Password 正本 → Cloudflare Secrets）
bash scripts/cf.sh secret put SLACK_WEBHOOK_URL_HEALTHCHECK --config apps/api/wrangler.toml --env production
bash scripts/cf.sh secret put HEALTHCHECK_FALLBACK_EMAIL --config apps/api/wrangler.toml --env production
bash scripts/cf.sh secret put RESEND_API_KEY --config apps/api/wrangler.toml --env production
# staging 側も同名で投入
```

## DoD（Phase 2 完了条件）

- [ ] 5 つの outputs/phase-02 ドキュメント全てが作成され、AC-1〜AC-7 / AC-9 にそれぞれ紐付いている
- [ ] 関数シグネチャ・I/O 契約・テストケースリストが本 phase-02.md に明記されている
- [ ] 変更対象ファイル一覧が新規 / 編集 / 削除区分付きで揃っている
- [ ] alert-relay 本体への影響がゼロであることが Request 偽造方式の説明で示されている
- [ ] dedupe 衝突回避策（`policy_id` の ISO 週番号サフィックス）が明記されている
- [ ] Slack channel 分離戦略の未設定時 fallback ルールが明記されている
- [ ] Mail fallback の Resend 採用根拠と quota 評価が記録されている
- [ ] 検証コマンドが `mise exec --` / `bash scripts/cf.sh` 経由で示されている
- [ ] CONDITIONAL の Phase 1 解消条件 2 件が本 Phase で具体化されている

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-01/requirements.md | Phase 1 確定事項 |
| 必須 | apps/api/wrangler.toml | cron 正本 |
| 必須 | apps/api/src/index.ts:388-499 | `scheduled` handler 既存構造 |
| 必須 | apps/api/src/routes/internal/alert-relay.ts | 呼出対象 |
| 必須 | apps/api/src/env.ts | binding 拡張対象 |
| 必須 | CLAUDE.md | Secret 管理 / `scripts/cf.sh` 利用ルール |
| 参考 | https://resend.com/docs/api-reference/emails/send-email | Resend send email API |
| 参考 | https://api.slack.com/messaging/webhooks | Slack Webhook 仕様 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-02/cron-schedule-design.md | cron 相乗り設計（AC-1） |
| ドキュメント | outputs/phase-02/scheduled-handler-design.md | handler 構造・I/O（AC-2, AC-3, AC-4） |
| ドキュメント | outputs/phase-02/mail-fallback-design.md | Resend Mail fallback（AC-5） |
| ドキュメント | outputs/phase-02/env-binding-design.md | env binding / Secret 投入（AC-6） |
| ドキュメント | outputs/phase-02/slack-channel-strategy.md | Slack channel 分離（AC-7） |

## 次 Phase

- 次: 3 (設計レビュー)
- 引き継ぎ事項: Phase 2 成果物 5 件、変更対象ファイル一覧、テストケース T-01〜T-10
- ブロック条件: outputs/phase-02 配下 5 ファイル未作成、または DoD 未充足の場合 Phase 3 へ進まない
