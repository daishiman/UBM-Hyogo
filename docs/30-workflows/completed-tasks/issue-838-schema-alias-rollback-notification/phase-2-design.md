# Phase 2: 設計 - タスク仕様書

## メタ情報

| 項目 | 内容 |
| --- | --- |
| Phase | 2 |
| Phase名 | 設計 |
| 前提Phase | Phase 1 |
| 後続Phase | Phase 3 |
| ステータス | completed |
| 作成日 | 2026-05-24 |
| 機能名 | issue-838-schema-alias-rollback-notification |
| 実装区分 | 実装仕様書 |

---

## 目的

rollback 通知の topology・関数シグネチャ・データ構造・redaction・config gate・failure isolation を確定し、Phase 4（テスト）が RED を書ける具体度に落とす。採用案と不採用案を記録する。

---

## 設計判断: 採用案と不採用案

### 採用案 A: best-effort auxiliary 通知（route 層 dispatch + audit 併記）

issue #588 の「required audit sink + best-effort auxiliary sink + try/catch 隔離 + redaction 二重防御」パターンを踏襲する。

```
POST /admin/schema/aliases/:aliasId/rollback
  │
  ├─ schemaAliasRollback(db, input)   ← D1 batch (softDelete + queueRestore + audit insert)  [既存・編集しない]
  │     └─ commit 成功 → result: SchemaAliasRollbackResult
  │
  ├─ try {                            ← ★ 新規: best-effort 通知（transaction 外）
  │     dispatchSchemaAliasRollbackNotification(deps, payload)
  │       ├─ Slack 設定あり → sendSlackMessage()   （優先）
  │       ├─ Slack 失敗 & mail 設定あり → MailSender.send()   （fallback）
  │       └─ どちらも未設定 → skipped
  │     → recordRollbackNotificationAudit(db, status)   ← audit_log に schema_alias.rollback_notification
  │   } catch { /* swallow: rollback result を壊さない */ }
  │
  └─ c.json(result, 200)             ← 通知の成否に関わらず rollback は 200
```

**採用理由**:
- rollback は admin 操作 → 通知対象は運用者（member ではない）。member 限定 `notification_outbox` は対象不一致。
- rollback は既に `audit_log` に記録済み = required sink 確立済み。追加は best-effort 通知のみで最小。
- 通知を transaction 外・try/catch 隔離にすることで AC-3（failure が rollback を壊さない）を構造的に保証。
- migration 不要（`audit_log` の `action` を増やすのみ）。

### 不採用案 B: notification_outbox の generic 化

member 限定の `notification_outbox`（`member_id` NOT NULL、`recipient_email` NOT NULL、`request_type` CHECK、`UNIQUE(note_id, outcome)`）に admin 通知用 `request_type = 'schema_alias_rollback'` を追加し、`member_id` を nullable 化する案。

**不採用理由**:
- member 限定スキーマへの破壊的変更（NOT NULL 解除・CHECK 拡張・UNIQUE 制約再設計）が必要で、既存 member 通知の整合性リスクが大きい。
- rollback 通知に `note_id` / `member_id` / `recipient_email` / `outcome` の意味論が無く、無理に埋めると semantics が破綻する。
- retry / DLQ の堅牢性は得られるが、運用通知に対しては過剰（best-effort で十分）。scale:medium を超過する。
- → Phase 3 でこの不採用判断を確認。将来 admin 通知が増えて outbox 化が必要になった場合は別 issue で扱う（本タスクでは先送りではなく「本質的にスコープ外」）。

---

## target topology

| concern | 対象ファイル | 責務 | lane |
| --- | --- | --- | --- |
| 通知 dispatch | `apps/api/src/workflows/schemaAliasRollbackNotification.ts`（新規） | Slack 優先 + mail fallback + redaction + status 算出 | 1 |
| route wiring | `apps/api/src/routes/admin/schema.ts`（編集） | rollback 成功後に dispatch を best-effort 発火 + audit 記録 | 1 |
| audit 記録 | 同上 route 内 helper or 同 workflow ファイル | `schema_alias.rollback_notification` entry insert | 1 |
| env 型 | `apps/api/src/routes/admin/_shared.ts`（要確認・編集の可能性） | `SLACK_WEBHOOK_URL` / `MAIL_PROVIDER_KEY` 等の型追加 | 1 |

> lane 数 1（単一 concern グループ）。validation lane は Phase 9 で直列に締める。

---

## 関数・型シグネチャ設計

### 新規モジュール: `schemaAliasRollbackNotification.ts`

```typescript
import type { DbCtx } from "../repository/_shared/db";
import type { SchemaAliasRollbackResult } from "./schemaAliasRollback";

/** 通知 channel の dispatch 結果 status */
export type RollbackNotificationStatus = "sent" | "failed" | "skipped";

/** 実際に送信に成功した channel（skipped/failed 時は null） */
export type RollbackNotificationChannel = "slack" | "mail" | "none";

/** redaction 済みの通知 payload（PII を含まない） */
export interface RollbackNotificationPayload {
  /** rollback 対象 alias の ID（PII ではない内部 ID） */
  readonly aliasId: string;
  /** 影響件数（response_fields COUNT） */
  readonly affectedResponseCount: number;
  /** 再集計要否 */
  readonly recomputeRequired: boolean;
  /** rollback 実行時刻（ISO8601） */
  readonly rolledBackAt: string;
  /** actor を redact した表示用識別子（生 email を含めない。例: "admin:redacted" or actor hash の先頭8桁） */
  readonly actorRef: string;
}

/** dispatch 結果（audit 記録に使う） */
export interface RollbackNotificationResult {
  readonly status: RollbackNotificationStatus;
  readonly channel: RollbackNotificationChannel;
  /** 送信試行回数（Slack/mail の attempts 合計） */
  readonly attempts: number;
  /** 失敗時の sanitized error class（生 message は含めない。例: "mail_provider_401" など） */
  readonly errorClass: string | null;
}

/** dispatch の依存（テスト差し替え用） */
export interface RollbackNotificationDeps {
  /** Slack webhook URL（未設定時 undefined） */
  readonly slackWebhookUrl?: string | undefined;
  /** mail 送信 sender（未設定時 undefined） */
  readonly mailSender?: MailSender | undefined;
  /** 運用通知の宛先メール（mail fallback 時。未設定時 undefined） */
  readonly opsEmail?: string | undefined;
  /** Slack 送信関数（既定: sendSlackMessage） */
  readonly sendSlack?: typeof sendSlackMessage;
  /** 現在時刻（既定: () => new Date().toISOString()） */
  readonly now?: () => string;
}

/**
 * rollback 成功後の運用通知を best-effort で送る。
 * - Slack 設定あり → Slack 送信。成功なら status='sent', channel='slack'。
 * - Slack 失敗 & mail 設定あり → mail 送信。成功なら status='sent', channel='mail'。
 * - 両方失敗 → status='failed', channel="none", errorClass にsanitized class。
 * - 両方未設定 → status='skipped', channel="none"。
 * - 例外は throw しない（必ず RollbackNotificationResult を返す。呼び出し側の隔離を二重化）。
 */
export async function dispatchSchemaAliasRollbackNotification(
  deps: RollbackNotificationDeps,
  payload: RollbackNotificationPayload,
): Promise<RollbackNotificationResult>;

/**
 * SchemaAliasRollbackResult + actor から redaction 済み payload を構築する。
 * - actor email は redactRollbackActor() でマスクする（生値を含めない）。
 * - stableKey は payload に含めない（AC-2）。
 */
export function buildRollbackNotificationPayload(
  result: SchemaAliasRollbackResult,
  actorEmail: string,
  now: string,
): RollbackNotificationPayload;

/**
 * actor email を表示用にマスクする。
 * 例: "admin@example.com" → "admin:redacted"（ローカル先頭2文字 + ドメイン全マスク）。
 * 空文字 / "unknown" は "unknown" を返す。
 */
export function redactRollbackActor(actorEmail: string): string;
```

### audit 記録 helper（route 内 or 同モジュール）

```typescript
/**
 * 通知結果を audit_log に schema_alias.rollback_notification entry として記録する。
 * - action = "schema_alias.rollback_notification"
 * - target_type = "schema_alias", target_id = aliasId
 * - after_json = { status, channel, attempts, errorClass, dispatchedAt }（PII 非包含）
 * - actor_email は既存 rollback audit と同様 actor を保存（audit_log は admin-only テーブルのため許容。
 *   ただし通知 payload 本文には生 email を載せない＝二重防御）。
 * - 失敗しても throw しない（best-effort）。
 */
export async function recordRollbackNotificationAudit(
  c: DbCtx,
  input: {
    aliasId: string;
    actor: string;
    result: RollbackNotificationResult;
    now: string;
  },
): Promise<void>;
```

### Slack message 構造（既存 `SlackBlockKitMessage` を使用）

```typescript
// dispatchSchemaAliasRollbackNotification 内で構築する Block Kit
{
  text: ":leftwards_arrow_with_hook: Schema alias rollback 実行",
  blocks: [
    { type: "header", text: { type: "plain_text", text: ":leftwards_arrow_with_hook: Schema alias rollback" } },
    { type: "section", fields: [
      { type: "mrkdwn", text: `*aliasId*\n${payload.aliasId}` },
      { type: "mrkdwn", text: `*影響件数*\n${payload.affectedResponseCount}` },
      { type: "mrkdwn", text: `*再集計要否*\n${payload.recomputeRequired ? "要" : "不要"}` },
      { type: "mrkdwn", text: `*実行者*\n${payload.actorRef}` },   // redact 済み
      { type: "mrkdwn", text: `*実行時刻*\n${payload.rolledBackAt}` },
    ] },
  ],
}
```

---

## データ構造: audit_log への記録

`audit_log`（既存・migration 不要）に新しい `action` 値を追加する。

| カラム | 値 |
| --- | --- |
| audit_id | `crypto.randomUUID()` |
| actor_email | actor（rollback と同じ。admin-only テーブルのため許容） |
| action | `schema_alias.rollback_notification`（新規 action 値） |
| target_type | `schema_alias` |
| target_id | aliasId |
| before_json | NULL |
| after_json | `{ status, channel, attempts, errorClass, dispatchedAt }`（JSON, PII 非包含） |
| created_at | ISO8601 |

> `action` 値の追加は CHECK 制約がある場合のみ migration 要。Phase 1 で `audit_log` DDL を Read し、`action` に CHECK 制約が**ない**ことを確認する（0003_auth_support.sql の DDL では `action TEXT NOT NULL` で CHECK なし → migration 不要）。CHECK 制約がある場合は Phase 2 で migration 追加を設計に追記する。

---

## redaction 設計（AC-2）— 二重防御（issue #588 踏襲）

| 層 | 防御 |
| --- | --- |
| payload 構築層 | `buildRollbackNotificationPayload()` で actor を `redactRollbackActor()` でマスク。stableKey は payload に**載せない**。 |
| 送信本文層 | Slack/mail 本文は payload のフィールドのみ参照。生 email / stableKey / token を参照する経路を作らない。 |
| audit 記録層 | `after_json` には status / channel / attempts / errorClass / dispatchedAt のみ。reason 生値・stableKey を含めない。 |

`errorClass` の sanitize: Slack/mail provider の結果から secret を含まない sanitized token（例: `slack_status_500`, `mail_provider_401`, Error.name）へ縮約（生 message を含めない。issue #401 L-I401-003 / #588 踏襲）。

---

## config gate 設計（AC-5）

| 設定状態 | 挙動 | status |
| --- | --- | --- |
| `SLACK_WEBHOOK_URL` あり | Slack 送信を試行 | 成功 `sent`(slack) / 失敗時 mail へ |
| Slack 失敗 + `MAIL_PROVIDER_KEY` & `opsEmail` あり | mail 送信を試行 | 成功 `sent`(mail) / 失敗 `failed` |
| Slack 設定なし + mail 設定あり | mail のみ試行 | `sent`(mail) / `failed` |
| 両方未設定 | 送信せず | `skipped` |

> config gate は dispatch 関数の冒頭で判定する（issue #401 L-I401-002 の「claim 前 gate」と同じ思想で、無駄な失敗を避ける）。

---

## failure isolation 設計（AC-3）

二重隔離:
1. `dispatchSchemaAliasRollbackNotification` は内部で全例外を catch し、必ず `RollbackNotificationResult` を返す（throw しない）。
2. route 層でも `dispatch` + `recordRollbackNotificationAudit` 全体を `try/catch` で囲み、万一の例外を swallow して `c.json(result, 200)` を返す。

→ rollback の D1 batch は dispatch より前に commit 済みなので、通知のどの失敗も rollback result に影響しない。

---

## env 型設計

Phase 1 タスク1 で `AdminRouteEnv`（`apps/api/src/routes/admin/_shared.ts`）を Read し、`SLACK_WEBHOOK_URL` / `MAIL_PROVIDER_KEY` / 運用通知先 email の型が存在するか確認する。

- 既存に `SLACK_WEBHOOK_URL` がある（alert-relay の `AlertRelayEnv`）→ admin env への露出方法を確認し、なければ追加する。
- 運用通知先 email 用に `OPS_NOTIFICATION_EMAIL`（新規 var）を `wrangler.toml [vars]` に追加する想定（非機密なので vars でよい）。Phase 1 で既存命名規則を確認の上、命名を確定する。

> env アクセスは apps/api では `c.env.*` 経由（apps/web の `getEnv()` 制約は API 側には非適用）。

---

## 実行タスク

### タスク1: 設計書本体の作成

**実行手順**:
1. 採用案 A / 不採用案 B を `outputs/phase-2/phase-2-design.md` に記録する
2. 関数シグネチャ・型・データ構造を転記する
3. redaction / config gate / failure isolation の表を含める

**期待される成果物**: `outputs/phase-2/phase-2-design.md`

### タスク2: env / migration 判定

**実行手順**:
1. `audit_log` DDL を Read し `action` の CHECK 制約有無を確認、migration 要否を判定する
2. `AdminRouteEnv` を Read し通知 env の追加要否を判定する
3. 判定結果を `outputs/phase-2/env-migration-decision.md` に記録する

**期待される成果物**: `outputs/phase-2/env-migration-decision.md`

### タスク3: モック実装雛型の提示（Phase 4 高速化）

**実行手順**:
1. `RollbackNotificationDeps` のテスト用モック（`sendSlack` を `vi.fn()` で差し替え、`mailSender.send` をスタブ）の雛型を設計書に含める

**期待される成果物**: 設計書内のモック雛型セクション

---

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| Slack 送信 | `apps/api/src/lib/slack-sender.ts` | `SendSlackResult` / retry |
| mail 送信 | `apps/api/src/services/mail/magic-link-mailer.ts` | `MailSender` / `MailSendResult` |
| best-effort パターン | `lessons-learned-issue-588-fallback-alert-slack-mail-extension-2026-05.md` | redaction 二重防御 |
| audit DDL | `apps/api/migrations/0003_auth_support.sql` | `audit_log` |

---

## 統合テスト連携

Phase 6 integration は本 Phase の topology（route → dispatch → audit）をそのまま検証シナリオにする。dispatch の deps をモックして 4 シナリオ（成功/fallback/両失敗/skip）を回す。

---

## 多角的チェック観点（AIが判断）

- **状態所有権**: rollback の D1 状態は `schemaAliasRollback` が所有。通知 status は audit_log が所有。両者を混ぜない（rollback audit と notification audit は別 entry）。
- **因果ループ**: 通知失敗 → audit `failed` 記録 → 運用者が手動再送（バランスループ）。通知が rollback を rollback させる強化ループは存在しない（隔離により遮断）。
- **トレードオフ**: best-effort は「通知欠落の可能性」を許容する代わりに「rollback の堅牢性」を守る。欠落は audit `failed` で検知可能。

---

## 成果物

| 成果物 | パス | 内容 |
| --- | --- | --- |
| 設計書本体 | `outputs/phase-2/phase-2-design.md` | 採用案 A / 不採用案 B・関数シグネチャ・データ構造・redaction・config gate・failure isolation |
| env/migration 判定 | `outputs/phase-2/env-migration-decision.md` | `audit_log.action` の CHECK 制約有無・`AdminRouteEnv` の通知 env 追加要否 |
| モック雛型 | 設計書内セクション | `RollbackNotificationDeps` のテスト用モック（`sendSlack` を `vi.fn()`、`mailSender.send` をスタブ） |

---

## 完了条件

- [ ] 採用案 A・不採用案 B を記録した
- [ ] 関数シグネチャ・型・データ構造を確定した
- [ ] redaction / config gate / failure isolation を設計した
- [ ] env / migration 要否を判定した
- [ ] モック雛型を提示した

---

## タスク100%実行確認【必須】

- [ ] 本Phase内の全タスクを100%実行完了
- [ ] 各タスクを100%完了し、完了を明記
- [ ] 成果物が全て生成されていることを確認

---

## 次Phase

`phase-3-design-review.md`（設計レビュー）へ進む。
