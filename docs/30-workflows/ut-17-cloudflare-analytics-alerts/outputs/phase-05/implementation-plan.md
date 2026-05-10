# UT-17 Phase 5: Implementation Plan

Phase 4 で確定した T3〜T7 / T11 を、関数シグネチャ・型・テスト ID レベルまで具体化する。本ドキュメントは Phase 6（test 先行）/ Phase 7（実装）で逐一参照する正本。

## 1. 変更対象ファイル一覧

### 新規追加（apps/api 配下）

| パス | 役割 | 対応サブタスク |
| --- | --- | --- |
| `apps/api/src/types/cloudflare-notification.ts` | Cloudflare Notifications generic webhook の入力型 | T5 |
| `apps/api/src/lib/cf-webhook-auth.ts` | `cf-webhook-auth` header の固定シークレット検証 pure function | T4 |
| `apps/api/src/lib/cloudflare-alert-formatter.ts` | Cloudflare payload → Slack Block Kit (日本語) | T5 |
| `apps/api/src/lib/slack-sender.ts` | Slack Incoming Webhook 送信 + retry | T6 |
| `apps/api/src/middleware/verify-cf-webhook-auth.ts` | Hono middleware（lib/cf-webhook-auth.ts を呼び出す） | T4 |
| `apps/api/src/routes/internal/alert-relay.ts` | `POST /internal/alert-relay` Hono route | T3 |
| `apps/api/src/lib/__tests__/cf-webhook-auth.test.ts` | T4 unit test | T7 |
| `apps/api/src/lib/__tests__/cloudflare-alert-formatter.test.ts` | T5 unit test | T7 |
| `apps/api/src/lib/__tests__/slack-sender.test.ts` | T6 unit test | T7 |
| `apps/api/src/routes/internal/__tests__/alert-relay.test.ts` | route 統合 test | T7 |

### 編集

| パス | 内容 |
| --- | --- |
| `apps/api/src/index.ts` | `createAlertRelayRoute` を import し `app.route("/internal", ...)` を追加 |
| `apps/api/src/env.ts` | `Env` に `CF_WEBHOOK_AUTH_SECRET?: string` と `SLACK_WEBHOOK_URL?: string` を追加 |
| `docs/30-workflows/runbooks/ut-17-cloudflare-usage-alert-response.md` | UT-17 アラート受信時の対応フロー（T11） |
| `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` | 新規（T11） |

## 2. 関数シグネチャ

### T4: cf-webhook-auth

```ts
// apps/api/src/lib/cf-webhook-auth.ts
export type CfWebhookAuthResult =
  | { ok: true }
  | { ok: false; reason: "missing-secret" | "missing-header" | "mismatch" };

export function verifyCfWebhookAuth(
  headerValue: string | null | undefined,
  expectedSecret: string | null | undefined,
): CfWebhookAuthResult;
```

```ts
// apps/api/src/middleware/verify-cf-webhook-auth.ts
export interface VerifyCfWebhookAuthEnv {
  readonly CF_WEBHOOK_AUTH_SECRET?: string;
}
export const verifyCfWebhookAuth: MiddlewareHandler<{ Bindings: VerifyCfWebhookAuthEnv }>;
```

### T5: formatter / types

```ts
// apps/api/src/types/cloudflare-notification.ts
export interface CloudflareNotificationPayload {
  readonly name?: string;
  readonly text?: string;
  readonly data?: Record<string, unknown>;
  readonly policy_id?: string;
  readonly account_id?: string;
  readonly alert_type?: string;
  readonly severity?: string;
  readonly ts?: number;
}

export type AlertMetric =
  | "workers_daily_requests"
  | "d1_read_rows"
  | "d1_write_rows"
  | "pages_build"
  | "r2_class_a"
  | "unknown";
```

```ts
// apps/api/src/lib/cloudflare-alert-formatter.ts
export interface SlackBlockKitMessage {
  readonly blocks: ReadonlyArray<unknown>;
  readonly text: string;
}

export function classifyAlertMetric(payload: CloudflareNotificationPayload): AlertMetric;

export function formatCloudflareAlertToSlack(
  payload: CloudflareNotificationPayload,
  options?: { readonly dashboardUrl?: string; readonly runbookUrl?: string },
): SlackBlockKitMessage;
```

### T6: slack-sender

```ts
// apps/api/src/lib/slack-sender.ts
export interface SendSlackResult {
  readonly ok: boolean;
  readonly status: number;
  readonly attempts: number;
  readonly error?: string;
}

export interface SendSlackOptions {
  readonly fetch?: typeof fetch;
  readonly maxRetries?: number; // default 3
  readonly backoffMs?: ReadonlyArray<number>; // default [200, 500, 1500]
}

export function sendSlackMessage(
  webhookUrl: string,
  message: SlackBlockKitMessage,
  options?: SendSlackOptions,
): Promise<SendSlackResult>;
```

### T3: route

```ts
// apps/api/src/routes/internal/alert-relay.ts
export interface AlertRelayDeps {
  readonly fetch?: typeof fetch;
  readonly dashboardUrl?: string;
  readonly runbookUrl?: string;
}

export function createAlertRelayRoute(deps?: AlertRelayDeps): Hono<{ Bindings: AlertRelayEnv }>;

export interface AlertRelayEnv {
  readonly CF_WEBHOOK_AUTH_SECRET?: string;
  readonly SLACK_WEBHOOK_URL?: string;
}
```

`POST /alert-relay` の挙動:

1. `verifyCfWebhookAuth` middleware で `cf-webhook-auth` header を検証（不正時 401）。
2. JSON body を `CloudflareNotificationPayload` として parse（不正 JSON は 400）。
3. `formatCloudflareAlertToSlack(payload, options)` で Slack Block Kit 生成。
4. `c.env.SLACK_WEBHOOK_URL` 未設定なら 503（webhook 未設定）。
5. `sendSlackMessage` で送信。`ok: true` で 200、`ok: false` で 502。

`index.ts` への登録:

```ts
import { createAlertRelayRoute } from "./routes/internal/alert-relay";
app.route("/internal/alert-relay", createAlertRelayRoute());
```

## 3. テスト ID 表

### `cf-webhook-auth.test.ts`

| ID | ケース | 期待 |
| --- | --- | --- |
| AUTH-01 | header と secret が一致 | `{ ok: true }` |
| AUTH-02 | header 欠落 | `{ ok: false, reason: "missing-header" }` |
| AUTH-03 | secret 欠落 | `{ ok: false, reason: "missing-secret" }` |
| AUTH-04 | header と secret 不一致 | `{ ok: false, reason: "mismatch" }` |

### `cloudflare-alert-formatter.test.ts`

| ID | ケース | 期待 |
| --- | --- | --- |
| FMT-01 | Workers Daily Requests payload | metric `workers_daily_requests`、`text` に「Workers リクエスト」が含まれる |
| FMT-02 | D1 Read Rows payload | metric `d1_read_rows`、「D1 読み取り」を含む |
| FMT-03 | D1 Write Rows payload | metric `d1_write_rows`、「D1 書き込み」を含む |
| FMT-04 | Pages Build payload | metric `pages_build`、「Pages ビルド」を含む |
| FMT-05 | R2 Class A payload | metric `r2_class_a`、「R2 Class A」を含む |
| FMT-06 | unknown payload | metric `unknown`、`text` に元 `name` が含まれる |
| FMT-07 | dashboardUrl / runbookUrl 指定 | blocks にリンク section が含まれる |
| FMT-08 | 日本語 metric / threshold / 残量 | message に「閾値」「残量」を含む |

### `slack-sender.test.ts`

| ID | ケース | 期待 |
| --- | --- | --- |
| SEND-01 | 200 即返却 | `attempts: 1`, `ok: true` |
| SEND-02 | 5xx → 5xx → 200 | `attempts: 3`, `ok: true` |
| SEND-03 | 4xx | `attempts: 1`, `ok: false`（即失敗） |
| SEND-04 | 5xx 連続 maxRetries 到達 | `attempts: 3`, `ok: false` |

### `alert-relay.test.ts`

| ID | ケース | 期待 |
| --- | --- | --- |
| ROUTE-01 | header 不正 | 401 |
| ROUTE-02 | 不正 JSON | 400 |
| ROUTE-03 | SLACK_WEBHOOK_URL 未設定 | 503 |
| ROUTE-04 | 正常 payload + Slack 200 | 200, `{ ok: true }` |
| ROUTE-05 | 正常 payload + Slack 5xx 連続 | 502 |

## 4. ローカル実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/api test
```

両方 PASS で本サイクルの DoD 達成。
