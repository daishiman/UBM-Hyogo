# Implementation Guide — issue-838-schema-alias-rollback-notification

## Part 1: Plain-Language Summary

なぜ必要か: schema alias rollback は運用上重要な修正操作なので、成功した事実を運用者がすぐ把握できる必要がある。一方で通知は補助機能であり、通知サービスの不調で rollback 本体を失敗扱いにしてはいけない。

何をしたか: rollback 成功後に Slack または mail へ best-effort 通知を送り、その結果を `audit_log` に記録する仕組みを追加した。通知が未設定・失敗の場合でも rollback API は成功レスポンスを返す。

たとえば、受付名簿の誤った別名を取り消したあと、担当者用の連絡ボードに「取り消し済み」と短く貼るイメージ。連絡ボードが一時的に使えなくても、名簿の訂正そのものは取り消さない。

The notification is best-effort. If Slack or mail is not configured, or if a provider fails, the API still returns the successful rollback response and records the notification status when possible.

Sensitive values are not copied into the notification body or notification audit payload. Actor email is reduced to `admin:redacted`, stableKey is not included, and provider errors are stored as an error class only.
Mail fallback renders the same text payload as escaped HTML inside `<pre>`, so dynamic values such as `aliasId` cannot inject markup into the operational email.

### 今回作ったもの

- rollback 通知 dispatch モジュール
- rollback route からの best-effort wiring
- `schema_alias.rollback_notification` audit 記録
- Slack success / mail fallback / skipped / failed / redaction の focused tests

## Part 2: Technical Summary

Added `apps/api/src/workflows/schemaAliasRollbackNotification.ts` as the focused dispatch module. It builds a redacted payload from `SchemaAliasRollbackResult`, attempts Slack first, falls back to mail, and returns `sent`, `failed`, or `skipped`.

The rollback route now calls the dispatch module after `schemaAliasRollback()` succeeds and before returning `200`. The notification and its audit insert are wrapped in a best-effort `try/catch`, so auxiliary failures do not change rollback behavior.

`schema_alias.rollback_notification` is recorded in `audit_log` with `target_type='schema_alias'`, `target_id=<aliasId>`, and a minimal `after_json` payload: `{ status, channel, attempts, errorClass, dispatchedAt }`.

```ts
export type RollbackNotificationStatus = "sent" | "failed" | "skipped";
export type RollbackNotificationChannel = "slack" | "mail" | "none";

export interface RollbackNotificationPayload {
  readonly aliasId: string;
  readonly rolledBackAt: string;
  readonly newVersion: number;
  readonly affectedResponseCount: number;
  readonly recomputeRequired: boolean;
  readonly actorRef: string;
}

export interface RollbackNotificationResult {
  readonly status: RollbackNotificationStatus;
  readonly channel: RollbackNotificationChannel;
  readonly attempts: number;
  readonly errorClass?: string;
  readonly dispatchedAt: string;
}
```

### APIシグネチャ

```ts
dispatchSchemaAliasRollbackNotification(
  deps: RollbackNotificationDeps,
  payload: RollbackNotificationPayload,
): Promise<RollbackNotificationResult>

recordRollbackNotificationAudit(
  c: DbCtx,
  input: RecordRollbackNotificationAuditInput,
): Promise<void>
```

### 使用例

```ts
const notificationResult = await dispatchSchemaAliasRollbackNotification(
  {
    slackWebhookUrl: env.SLACK_WEBHOOK_INCIDENT ?? env.SLACK_WEBHOOK_URL,
    mailSender,
    fromEmail: env.MAIL_FROM_ADDRESS,
    opsEmail: env.OPS_NOTIFICATION_EMAIL,
  },
  buildRollbackNotificationPayload(result, actorEmail),
);
```

### エラーハンドリング

Notification dispatch catches provider failures and converts them into `RollbackNotificationResult`. The route wraps dispatch and audit recording in a second `try/catch`, so auxiliary sink failures never change a successful rollback response.

Provider error detail is reduced to `errorClass`. Raw provider bodies, webhook URLs, tokens, stableKey, and raw actor email are not copied into notification payload or notification audit `after_json`.

### エッジケース

When no notification channel is configured, the result is `skipped / none / attempts=0`. When Slack fails and mail is configured, mail is attempted and total attempts include the Slack attempts plus the mail attempt.

When all configured channels fail, the result is `failed` with sanitized `errorClass`. If audit recording itself fails, the route still returns rollback `200` because notification audit is auxiliary.

### 設定項目と定数一覧

| Name | Purpose |
| --- | --- |
| `SLACK_WEBHOOK_INCIDENT` | Preferred incident Slack webhook |
| `SLACK_WEBHOOK_URL` | Legacy Slack fallback |
| `MAIL_PROVIDER_KEY` | Mail provider API key |
| `MAIL_FROM_ADDRESS` | Mail sender address |
| `OPS_NOTIFICATION_EMAIL` | Operations recipient |
| `schema_alias.rollback_notification` | Audit action |

### テスト構成

`schemaAliasRollbackNotification.spec.ts` covers Slack success, Slack-to-mail fallback, skipped config, failed channels, and audit payload redaction. `schema.rollback.spec.ts` covers route-level skipped notification audit after a successful rollback.

The focused command is:

```bash
pnpm exec vitest run --root=. --config=vitest.config.ts apps/api/src/workflows/schemaAliasRollbackNotification.spec.ts apps/api/src/routes/admin/__tests__/schema.rollback.spec.ts
```

## Files Changed

| Path | Change |
| --- | --- |
| `apps/api/src/workflows/schemaAliasRollbackNotification.ts` | New dispatch, redaction, and audit helper module |
| `apps/api/src/workflows/schemaAliasRollbackNotification.spec.ts` | New unit and contract tests for Slack, mail fallback, skipped, failed, and audit payload |
| `apps/api/src/routes/admin/schema.ts` | Rollback route best-effort notification wiring |
| `apps/api/src/routes/admin/_shared.ts` | Admin env type extension |
| `apps/api/src/routes/admin/__tests__/schema.rollback.spec.ts` | Route regression for skipped notification audit |

## Verification Commands

```bash
pnpm exec vitest run --root=. --config=vitest.config.ts apps/api/src/workflows/schemaAliasRollbackNotification.spec.ts apps/api/src/routes/admin/__tests__/schema.rollback.spec.ts
pnpm --filter @ubm-hyogo/api typecheck
```

## Known Runtime Boundary

Provider delivery evidence requires staging secrets and a staging rollback smoke. That operation remains user-gated and is recorded in Phase 11 as runtime pending, not local PASS.
