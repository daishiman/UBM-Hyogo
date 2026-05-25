# Phase 5: 実装（GREEN）- タスク仕様書

## メタ情報

| 項目 | 内容 |
| --- | --- |
| Phase | 5 |
| Phase名 | 実装（GREEN） |
| 前提Phase | Phase 4（テスト RED 確認済み） |
| 後続Phase | Phase 6 |
| ステータス | completed |
| 作成日 | 2026-05-24 |
| 機能名 | issue-838-schema-alias-rollback-notification |
| 実装区分 | 実装仕様書 |

---

## 目的

Phase 4 で作成した RED テストをすべて GREEN にする最小実装を行う。過剰実装は避け、テストを通す最小限の変更に集中する。テスト全件 PASS + typecheck PASS + lint PASS が GREEN 完了の定義。

---

## 実行タスク

| # | タスク | 詳細セクション |
| --- | --- | --- |
| 1 | 新規/修正ファイルの確定（RT-03） | 「変更対象ファイル一覧」 |
| 2 | `schemaAliasRollbackNotification.ts` の各関数を最小実装（dispatch 分岐・redaction・config gate・errorClass sanitize・二重 try/catch 隔離） | 「実装方針詳細」 |
| 3 | rollback route への best-effort wiring + audit 記録 | 「実装方針詳細」 |
| 4 | env 型・wrangler vars・`.dev.vars.example` の追記（不足時のみ） | 「変更対象ファイル一覧（修正）」 |
| 5 | GREEN 確認（テスト全件 + typecheck + lint） | 「GREEN 確認手順」「ローカル実行コマンド」 |

---

## 変更対象ファイル一覧（RT-03 必須）

### 新規作成

| ファイルパス | 役割 |
| --- | --- |
| `apps/api/src/workflows/schemaAliasRollbackNotification.ts` | 通知 dispatch 本体（新規モジュール） |
| `apps/api/src/workflows/schemaAliasRollbackNotification.spec.ts` | unit テスト（Phase 4 で作成済み） |

### 修正

| ファイルパス | 変更内容 | 変更規模 |
| --- | --- | --- |
| `apps/api/src/routes/admin/schema.ts` | rollback route に best-effort dispatch + audit 記録を追加（約381行目付近） | 小（15〜25行追加） |
| `apps/api/src/routes/admin/_shared.ts` | `AdminRouteEnv` 型に `SLACK_WEBHOOK_URL` / `OPS_NOTIFICATION_EMAIL` を追加（Phase 1 で既存確認後、不足時のみ） | 最小（要 Read 確認） |
| `apps/api/wrangler.toml` | `[vars]` に `OPS_NOTIFICATION_EMAIL = ""` を追記（非機密・staging/production 各 env に追加） | 最小 |
| `apps/api/.dev.vars.example` | `SLACK_WEBHOOK_URL` / `OPS_NOTIFICATION_EMAIL` の op 参照コメントを追記（実値は書かない） | 最小 |

> `MAIL_PROVIDER_KEY` は既存 secret として登録済み想定。`.dev.vars.example` にのみコメント参照を追記する。

---

## 実装方針詳細（CONST_005）

### 1. `schemaAliasRollbackNotification.ts` 実装疑似コード

```typescript
import { sendSlackMessage } from "../lib/slack-sender";
import type { MailSender } from "../services/mail/magic-link-mailer";
import type { DbCtx } from "../repository/_shared/db";
import type { SchemaAliasRollbackResult } from "./schemaAliasRollback";

// --- 型定義（Phase 2 シグネチャ準拠） ---
export type RollbackNotificationStatus = "sent" | "failed" | "skipped";
export type RollbackNotificationChannel = "slack" | "mail" | "none";
export interface RollbackNotificationPayload { ... }
export interface RollbackNotificationResult { ... }
export interface RollbackNotificationDeps { ... }

// --- config gate 判定 ---
// 冒頭で slackWebhookUrl / (mailSender + opsEmail) いずれも未設定なら即 skipped 返却
function hasSlackConfig(deps: RollbackNotificationDeps): boolean {
  return typeof deps.slackWebhookUrl === "string" && deps.slackWebhookUrl.length > 0;
}
function hasMailConfig(deps: RollbackNotificationDeps): boolean {
  return deps.mailSender !== undefined && typeof deps.opsEmail === "string" && deps.opsEmail.length > 0;
}

// --- errorClass sanitize ---
function sanitizeSlackError(status: number | undefined): string {
  if (status === undefined) return "slack";
  return `slack_status_${status}`;
}
function sanitizeMailError(err: unknown): string {
  // provider body / token / URL は含めず、先頭 token または Error.name のみに縮約する
  return sanitizeErrorClass(err);
}

// --- dispatch 本体 ---
export async function dispatchSchemaAliasRollbackNotification(
  deps: RollbackNotificationDeps,
  payload: RollbackNotificationPayload,
): Promise<RollbackNotificationResult> {
  // ① config gate: 両方未設定 → skipped
  if (!hasSlackConfig(deps) && !hasMailConfig(deps)) {
    return { status: "skipped", channel: "none", attempts: 0, errorClass: null };
  }

  const sendSlack = deps.sendSlack ?? sendSlackMessage;
  let slackErrorClass: string | null = null;

  // ② Slack 試行（設定ありの場合）
  if (hasSlackConfig(deps)) {
    try {
      const slackResult = await sendSlack(deps.slackWebhookUrl!, buildSlackMessage(payload));
      if (slackResult.ok) {
        return { status: "sent", channel: "slack", attempts: 1, errorClass: null };
      }
      slackErrorClass = sanitizeSlackError(slackResult.status);
    } catch {
      slackErrorClass = "slack_network";
    }
  }

  // ③ mail fallback 試行（設定ありの場合）
  if (hasMailConfig(deps)) {
    try {
      const mailResult = await deps.mailSender!.send({
        to: deps.opsEmail!,
        subject: "Schema alias rollback 実行通知",
        html: buildMailBody(payload),
      });
      if (mailResult.success) {
        return { status: "sent", channel: "mail", attempts: 1, errorClass: null };
      }
      return { status: "failed", channel: "mail", attempts: 2, errorClass: "mail_provider_401" };
    } catch (err) {
      return {
        status: "failed",
        channel: "none",
        attempts: slackErrorClass !== null ? 2 : 1,
        errorClass: slackErrorClass ?? sanitizeMailError(err),
      };
    }
  }

  // ④ Slack 失敗 + mail 未設定
  return { status: "failed", channel: "none", attempts: 1, errorClass: slackErrorClass };
}
```

> Slack Block Kit メッセージ構築は `buildSlackMessage(payload)` ヘルパーで行う。Phase 2 の Block Kit 定義を参照。

### 2. `redactRollbackActor` 実装

```typescript
export function redactRollbackActor(actorEmail: string): string {
  if (!actorEmail || actorEmail === "unknown") return "unknown";
  const atIdx = actorEmail.indexOf("@");
  if (atIdx < 0) return "unknown";
  const local = actorEmail.slice(0, atIdx);
  const prefix = local.slice(0, Math.min(2, local.length));
  return `${prefix}***@***`;
}
```

- ローカルパートの先頭 `Math.min(2, local.length)` 文字のみ開示し、残り + ドメインは全マスク
- `@` を含まない文字列は `"unknown"` を返す

### 3. `buildRollbackNotificationPayload` 実装

```typescript
export function buildRollbackNotificationPayload(
  result: SchemaAliasRollbackResult,
  actorEmail: string,
  now: string,
): RollbackNotificationPayload {
  return {
    aliasId: result.aliasId,
    affectedResponseCount: result.impact.affectedResponseCount,
    recomputeRequired: result.impact.recomputeRequired,
    rolledBackAt: now,
    actorRef: redactRollbackActor(actorEmail),
    // stableKey は含めない（AC-2）
  };
}
```

### 4. `recordRollbackNotificationAudit` 実装

```typescript
export async function recordRollbackNotificationAudit(
  c: DbCtx,
  input: { aliasId: string; actor: string; result: RollbackNotificationResult; now: string },
): Promise<void> {
  const afterJson = JSON.stringify({
    status: input.result.status,
    channel: input.result.channel,
    attempts: input.result.attempts,
    errorClass: input.result.errorClass,
    dispatchedAt: input.now,
  });
  // actor_email = input.actor（audit_log は admin-only テーブル）
  // after_json に生 email は含めない（afterJson は status/channel/attempts/errorClass/dispatchedAt のみ）
  await c.prepare(
    `INSERT INTO audit_log (audit_id, actor_email, action, target_type, target_id, before_json, after_json, created_at)
     VALUES (?, ?, ?, ?, ?, NULL, ?, ?)`
  )
  .bind(
    crypto.randomUUID(),
    input.actor,
    "schema_alias.rollback_notification",
    "schema_alias",
    input.aliasId,
    afterJson,
    input.now,
  )
  .run();
}
```

### 5. rollback route 改修（`apps/api/src/routes/admin/schema.ts`）

rollback の D1 batch commit 後（`await schemaAliasRollback(...)` の完了後）、既存の `c.json(result, 200)` の直前に以下を追加する:

```typescript
// ★ best-effort 運用通知（rollback transaction とは独立）
try {
  const actorEmail = c.get("jwtPayload")?.email ?? "unknown";
  const now = new Date().toISOString();
  const notificationPayload = buildRollbackNotificationPayload(rollbackResult, actorEmail, now);
  const notificationDeps: RollbackNotificationDeps = {
    slackWebhookUrl: c.env.SLACK_WEBHOOK_URL,
    mailSender: c.env.MAIL_PROVIDER_KEY
      ? createResendSender({ apiKey: c.env.MAIL_PROVIDER_KEY })
      : undefined,
    opsEmail: c.env.OPS_NOTIFICATION_EMAIL,
  };
  const notificationResult = await dispatchSchemaAliasRollbackNotification(
    notificationDeps,
    notificationPayload,
  );
  await recordRollbackNotificationAudit(c.env.DB, {
    aliasId: aliasId,
    actor: actorEmail,
    result: notificationResult,
    now,
  });
} catch {
  // swallow: 通知の失敗は rollback result（200）を壊さない（AC-3）
}

return c.json(rollbackResult, 200);
```

> `c.env.DB` の型は `AdminRouteEnv` 経由。`SLACK_WEBHOOK_URL` / `OPS_NOTIFICATION_EMAIL` が型に存在しない場合は `_shared.ts` への追加も行う。

### 6. env 型 `AdminRouteEnv` への追加（`_shared.ts`）

Phase 1 の Read 結果で未定義の場合のみ追記する:

```typescript
// apps/api/src/routes/admin/_shared.ts
export type AdminRouteEnv = {
  // ...既存フィールド...
  SLACK_WEBHOOK_URL?: string;        // 既存（alert-relay）に無ければ追加
  OPS_NOTIFICATION_EMAIL?: string;   // 新規追加
  // MAIL_PROVIDER_KEY は既存に存在するか確認後、なければ追加
};
```

> optional (`?`) とすることで config gate（未設定 = `undefined` = skip）の型整合を保つ。

---

## GREEN 確認手順

```bash
# 1. テスト実行（全 PASS になること）
mise exec -- pnpm --filter @ubm-hyogo/api test -- apps/api/src/workflows/schemaAliasRollbackNotification.spec.ts

# 2. 型チェック（0 エラーになること）
mise exec -- pnpm typecheck

# 3. リント（0 エラーになること）
mise exec -- pnpm lint

# 4. 全テスト回帰確認（apps/api 全体）
mise exec -- pnpm --filter @ubm-hyogo/api test
```

---

## ローカル実行コマンド（CONST_005）

| コマンド | 目的 |
| --- | --- |
| `mise exec -- pnpm --filter @ubm-hyogo/api test -- apps/api/src/workflows/schemaAliasRollbackNotification.spec.ts` | 新規テストのみ実行 |
| `mise exec -- pnpm typecheck` | 型チェック |
| `mise exec -- pnpm lint` | リント |
| `mise exec -- pnpm --filter @ubm-hyogo/api test` | apps/api 全テスト（回帰確認） |

---

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| 設計シグネチャ | `phase-2-design.md` | 全関数シグネチャ・型定義・Slack Block Kit |
| テスト RED | `phase-4-test-plan.md` | GREEN にすべきテストシナリオ一覧 |
| Slack sender | `apps/api/src/lib/slack-sender.ts` | `sendSlackMessage` / `SendSlackResult` |
| mail sender | `apps/api/src/services/mail/magic-link-mailer.ts` | `MailSender` / `createResendSender` |
| rollback workflow | `apps/api/src/workflows/schemaAliasRollback.ts` | `SchemaAliasRollbackResult` |
| rollback route | `apps/api/src/routes/admin/schema.ts` | 改修対象（約381行目） |
| audit DDL | `apps/api/migrations/0003_auth_support.sql` | `audit_log` カラム確認 |

---

## 成果物

| 成果物 | パス | 内容 |
| --- | --- | --- |
| 通知 dispatch モジュール | `apps/api/src/workflows/schemaAliasRollbackNotification.ts` | dispatch / payload 構築 / redactRollbackActor / audit 記録の実装 |
| route 改修 | `apps/api/src/routes/admin/schema.ts` | rollback 成功後の best-effort dispatch + audit wiring |
| env 追記 | `apps/api/wrangler.toml` / `.dev.vars.example` / `_shared.ts` | 通知 env（実値は書かない） |
| GREEN 実行記録 | `outputs/phase-5/green-run-result.md` | test 全件 PASS + typecheck + lint の結果 |

---

## DoD（Definition of Done）

- [ ] `schemaAliasRollbackNotification.ts` を新規作成し、全エクスポート関数を実装した
- [ ] Phase 4 のテストファイルの全 it ブロックが GREEN になった（PASS）
- [ ] `apps/api/src/routes/admin/schema.ts` の rollback route に best-effort dispatch + audit 記録を追加した
- [ ] `AdminRouteEnv` に `SLACK_WEBHOOK_URL` / `OPS_NOTIFICATION_EMAIL` が型として含まれる
- [ ] `apps/api/wrangler.toml` に `OPS_NOTIFICATION_EMAIL` vars を追記した
- [ ] `apps/api/.dev.vars.example` に通知設定の op 参照コメントを追記した
- [ ] `mise exec -- pnpm typecheck` が 0 エラーで通る
- [ ] `mise exec -- pnpm lint` が 0 エラーで通る
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/api test` が全件 PASS になった（回帰なし）
- [ ] GREEN 確認結果を `outputs/phase-5/green-run-result.md` に記録した

---

## 完了条件

- [ ] 上記 DoD の全項目を満たした（GREEN 実装完了）
- [ ] 新規/修正ファイルが「変更対象ファイル一覧」と一致している
- [ ] best-effort 隔離（dispatch 内 catch + route 層 try/catch）が実装されている

---

## タスク100%実行確認【必須】

- [ ] 本Phase内の全タスクを100%実行完了
- [ ] 各タスクを100%完了し、完了を明記
- [ ] 成果物が全て生成されていることを確認

---

## 次Phase

`phase-6-test-additions.md`（テスト拡充）へ進む。全テスト GREEN + typecheck + lint の PASS を確認してから Phase 6 へ進む。
