# Phase 2 / scheduled-handler-design — outputs

[実装区分: 実装仕様書]

> **AC 紐付け**: AC-2 / AC-3 / AC-4

## 1. モジュール配置

新規ファイル `apps/api/src/scheduled/healthcheck.ts`。`apps/api/src/scheduled/` は本タスクで新設するディレクトリ。
将来 alert-relay 以外の scheduled subtask を追加する余地を残す。

## 2. Public API

```typescript
// apps/api/src/scheduled/healthcheck.ts

import type { Hono } from "hono";
import { createAlertRelayRoute, type AlertRelayEnv } from "../routes/internal/alert-relay";

/** runAlertRelayHealthcheck が利用する env binding。Env からの subset。 */
export interface HealthcheckEnv {
  readonly CF_WEBHOOK_AUTH_SECRET?: string;
  readonly SLACK_WEBHOOK_URL?: string;
  readonly SLACK_WEBHOOK_URL_HEALTHCHECK?: string;
  readonly HEALTHCHECK_FALLBACK_EMAIL?: string;
  readonly RESEND_API_KEY?: string;
  readonly CF_ALERT_DASHBOARD_URL?: string;
  readonly CF_ALERT_RUNBOOK_URL?: string;
  readonly ENVIRONMENT?: "production" | "staging" | "development";
}

/** 依存注入境界。test 時は全て差し替え可能。 */
export interface HealthcheckDeps {
  readonly fetch?: typeof fetch;
  readonly now?: () => Date;
  /** 関数注入で alert-relay Hono を差し替えるための DI hook（テスト専用）。 */
  readonly relayAppFactory?: () => Hono<{ Bindings: AlertRelayEnv }>;
}

export type HealthcheckStatus =
  | "ok"
  | "skipped"
  | "slack_failed_mail_sent"
  | "slack_failed_mail_failed"
  | "auth_secret_missing"
  | "internal_error";

export interface HealthcheckMailFallbackResult {
  readonly status: HealthcheckStatus;
  readonly slackStatus?: number;
  readonly slackBody?: string;
  readonly mailStatus?: number;
  readonly reason?: string;
  readonly policyId: string;
}

/** ISO 週番号付き payload。Cloudflare Notifications generic webhook 互換。 */
export interface HealthcheckPayload {
  readonly name: "UT-17 weekly healthcheck";
  readonly severity: "info";
  readonly alert_type: "ut17_healthcheck";
  readonly policy_id: string; // "ut-17-weekly-healthcheck-2026W20"
  readonly ts: number;
  readonly data: {
    readonly healthcheck: true;
    readonly isoWeek: string;
    readonly environment?: string;
  };
}

/** dayOfWeek=1 (UTC 月曜) のみ実行。それ以外は { status: "skipped" } を返す。 */
export async function runAlertRelayHealthcheck(
  env: HealthcheckEnv,
  ctx: ExecutionContext,
  event: ScheduledController,
  deps?: HealthcheckDeps,
): Promise<HealthcheckMailFallbackResult>;

export function buildHealthcheckPayload(now: Date, environment?: string): HealthcheckPayload;

/** ISO 8601 week number を YYYY"W"WW 形式で返す（例: "2026W20"）。 */
export function formatIsoWeek(date: Date): string;
```

> `sendMailFallback` の関数シグネチャは `mail-fallback-design.md` で定義する。

## 3. 内部フロー詳細

```
runAlertRelayHealthcheck(env, ctx, event, deps)
  │
  ├─ const now = deps?.now?.() ?? new Date()
  ├─ const dayOfWeek = new Date(event.scheduledTime ?? now.getTime()).getUTCDay()
  ├─ if (dayOfWeek !== 1)
  │     return { status: "skipped", reason: "not_monday", policyId: "" }
  │
  ├─ if (!env.CF_WEBHOOK_AUTH_SECRET)
  │     console.warn("[ut17-healthcheck] auth secret missing")
  │     return { status: "auth_secret_missing", policyId: "" }
  │
  ├─ const payload = buildHealthcheckPayload(now, env.ENVIRONMENT)
  ├─ const webhookUrl = env.SLACK_WEBHOOK_URL_HEALTHCHECK ?? env.SLACK_WEBHOOK_URL
  ├─ if (!webhookUrl)
  │     return { status: "skipped", reason: "no_slack_webhook", policyId: payload.policy_id }
  │
  ├─ // Request 偽造で alert-relay route を内部呼出
  ├─ const relayApp = deps?.relayAppFactory?.() ?? createAlertRelayRoute()
  ├─ const req = new Request("https://internal/", {
  │     method: "POST",
  │     headers: {
  │       "content-type": "application/json",
  │       "cf-webhook-auth": env.CF_WEBHOOK_AUTH_SECRET,
  │     },
  │     body: JSON.stringify(payload),
  │   })
  │
  ├─ // Slack 投稿先を healthcheck channel に切替えるため env を一時 override
  ├─ const scopedEnv = { ...env, SLACK_WEBHOOK_URL: webhookUrl }
  │
  ├─ let relayResponse: Response
  ├─ try {
  │     relayResponse = await relayApp.fetch(req, scopedEnv, ctx)
  │   } catch (err) {
  │     console.error("[ut17-healthcheck] relay throw", { error: ... })
  │     return await fallbackToMail(env, "relay_throw", payload.policy_id, deps)
  │   }
  │
  ├─ const body = await relayResponse.text()
  ├─ const status = relayResponse.status
  │
  ├─ // alert-relay 側で Slack 200+body="ok" を検証済。relay の戻り値 status=200 を成功とみなす
  ├─ if (status === 200) {
  │     let json: { ok?: boolean; deduped?: boolean } | null = null
  │     try { json = JSON.parse(body) } catch { /* ignore */ }
  │     if (json && json.ok === true) {
  │       console.log("[ut17-healthcheck] ok", { deduped: json.deduped ?? false, policyId: payload.policy_id })
  │       return { status: "ok", slackStatus: status, slackBody: body, policyId: payload.policy_id }
  │     }
  │   }
  │
  ├─ // 失敗 → mail fallback
  └─ return await fallbackToMail(env, `relay_failed_status_${status}_body_${body.slice(0,64)}`, payload.policy_id, deps)
```

## 4. Slack 投稿成功判定の二段化

本モジュールは **alert-relay 経由** で Slack に投げるため、Slack 200+body="ok" の検証は `apps/api/src/lib/slack-sender.ts` 内の既存ロジックが担う（UT-17 で実装済）。
healthcheck.ts はその結果として relay が返す `{ ok: true }` JSON のみを成功条件とする。

二段検証の責務分担:

| 検証段 | 担当 | 内容 |
| --- | --- | --- |
| 1 段目 (Slack 直 HTTP) | `apps/api/src/lib/slack-sender.ts` | `response.status === 200 && (await response.text()).trim() === "ok"` |
| 2 段目 (relay 戻り値) | `apps/api/src/scheduled/healthcheck.ts` | `relayResponse.status === 200 && body.ok === true` |

> 1 段目の実装が `sendSlackMessage` に存在することは Phase 02 着手時に再確認する。
> 万一未実装の場合は、UT-17 不変条件 6 を満たすため `slack-sender.ts` 側に補強パッチを当てる（本タスクのスコープに含める）。

## 5. dedupe 衝突回避

`apps/api/src/routes/internal/alert-relay.ts:35-69` の dedupe は `[classifyAlertMetric(payload), policy_id ?? name ?? alert_type, minuteBucket].join(":")` で 5 分窓 (`dedupeTtlMs = 5*60*1000`)。

healthcheck は週 1 回かつ `policy_id = "ut-17-weekly-healthcheck-2026W20"` のように **ISO 週番号** をサフィックスに含むため、5 分窓に同一キーが衝突する余地はない。万一手動テストで同週内 2 回叩いても 5 分以上空ければ通る。

## 6. 構造化 log フォーマット

| 状況 | log 関数 | フォーマット例 |
| --- | --- | --- |
| 成功 | `console.log` | `{ tag: "ut17-healthcheck", status: "ok", policyId, slackStatus, deduped }` |
| Slack 失敗→Mail 成功 | `console.warn` | `{ tag: "ut17-healthcheck", status: "slack_failed_mail_sent", policyId, slackStatus, slackBody, mailStatus, reason }` |
| Slack 失敗→Mail 失敗 | `console.error` | `{ tag: "ut17-healthcheck", status: "slack_failed_mail_failed", policyId, slackStatus, mailStatus, reason }` |
| dayOfWeek 不一致 | `console.debug` (or 省略) | `{ tag: "ut17-healthcheck", status: "skipped", reason: "not_monday" }` |
| env 未設定 | `console.warn` | `{ tag: "ut17-healthcheck", status: "auth_secret_missing" }` |

すべて 1 オブジェクトの単一 `console.*` 呼出に統一し、Cloudflare Logs から `grep ut17-healthcheck` で全件抽出可能にする。

## 7. 変更対象ファイル

| パス | 区分 | 概要 |
| --- | --- | --- |
| `apps/api/src/scheduled/healthcheck.ts` | 新規 | 上記 Public API + 内部実装、約 150-200 行 |
| `apps/api/src/scheduled/healthcheck.test.ts` | 新規 | Vitest unit test (T-01..T-10) |
| `apps/api/src/lib/slack-sender.ts` | 編集（条件付き） | 1 段目 200+body 検証が未実装の場合のみ補強 |

## 8. ローカル実行・検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/api test src/scheduled/healthcheck.test.ts
```

## 9. DoD

- [x] `runAlertRelayHealthcheck` / `buildHealthcheckPayload` / `formatIsoWeek` の関数シグネチャが TypeScript で明示
- [x] HealthcheckEnv / HealthcheckDeps / HealthcheckMailFallbackResult / HealthcheckPayload の型定義が示されている
- [x] Request 偽造 (`new Request("https://internal/", { ... })`) の具体構造が示されている
- [x] Slack 200+body="ok" の二段検証が示されている（1 段は slack-sender / 2 段は healthcheck）
- [x] dedupe 衝突回避策（ISO 週サフィックス）が示されている
- [x] 構造化 log フォーマットが示されている
