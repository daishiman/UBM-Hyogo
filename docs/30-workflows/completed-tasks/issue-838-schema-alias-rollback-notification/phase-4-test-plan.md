# Phase 4: テスト作成（RED）- タスク仕様書

## メタ情報

| 項目 | 内容 |
| --- | --- |
| Phase | 4 |
| Phase名 | テスト作成（RED） |
| 前提Phase | Phase 3（設計レビュー PASS/MINOR） |
| 後続Phase | Phase 5 |
| ステータス | completed |
| 作成日 | 2026-05-24 |
| 機能名 | issue-838-schema-alias-rollback-notification |
| 実装区分 | 実装仕様書 |

---

## 目的

Phase 2 で確定した設計（関数シグネチャ・型・redaction・config gate・failure isolation）に基づき、実装前に RED になるテストを書く。テストは仕様の実行可能なドキュメントとして機能し、Phase 5 の GREEN 実装の完了基準を確定する。

> **TDD RED**: このPhaseでは実装モジュールは**作成しない**。テストファイルのみを作成する。全テストは `import` が解決できないか、実装が存在しないため RED（失敗）になることを確認する。

---

## 実行タスク

| # | タスク | 詳細セクション |
| --- | --- | --- |
| 1 | テスト対象モジュール・新規テストファイルの確定 | 「テスト対象モジュール」「新規テストファイル」 |
| 2 | deps モック方針の確定（`sendSlack` を `vi.fn()`、`mailSender` をスタブ） | 「deps モック方針」 |
| 3 | テストシナリオ（dispatch 4 シナリオ / payload 構築 / `redactRollbackActor` / audit）の RED 記述 | 「テストシナリオ一覧」 |
| 4 | Route 層 integration の予告（Phase 6 本実施） | 「Route 層 integration の予告」 |
| 5 | command suite の RED 実行確認 | 「command suite（RED 確認）」 |

> テストパターンが Phase 1-3 で確認した命名規則（camelCase 関数 / PascalCase 型）と整合していることを RED 記述前に検証する。

---

## テスト対象モジュール

| 対象関数/型 | 所在（新規モジュール） | 対応 AC |
| --- | --- | --- |
| `dispatchSchemaAliasRollbackNotification` | `apps/api/src/workflows/schemaAliasRollbackNotification.ts` | AC-1, AC-3, AC-5 |
| `buildRollbackNotificationPayload` | 同上 | AC-2 |
| `redactRollbackActor` | 同上 | AC-2 |
| `recordRollbackNotificationAudit` | 同上 | AC-4 |

---

## 新規テストファイル

**パス**: `apps/api/src/workflows/schemaAliasRollbackNotification.spec.ts`

> `*.test.ts` は禁止（CLAUDE.md 不変条件 #8）。必ず `*.spec.ts` で作成する。

---

## deps モック方針

Phase 2「タスク3: モック実装雛型」に基づき、以下の差し替え戦略を使う。

```typescript
import { vi, describe, it, expect, beforeEach } from "vitest";
import type {
  RollbackNotificationDeps,
  RollbackNotificationPayload,
} from "../schemaAliasRollbackNotification";

// sendSlack モック
const mockSendSlack = vi.fn();

// mailSender モック
const mockMailSender = {
  send: vi.fn(),
};

// now 固定
const FIXED_NOW = "2026-05-24T10:00:00.000Z";

// 基本 payload（PII 非包含・redact 済みを前提として組む）
const basePayload: RollbackNotificationPayload = {
  aliasId: "alias-abc-123",
  affectedResponseCount: 5,
  recomputeRequired: true,
  rolledBackAt: FIXED_NOW,
  actorRef: "admin:redacted",
};

// deps ファクトリ
function makeDeps(overrides?: Partial<RollbackNotificationDeps>): RollbackNotificationDeps {
  return {
    slackWebhookUrl: "https://hooks.slack.com/test-webhook",
    mailSender: mockMailSender,
    opsEmail: "ops@example.com",
    sendSlack: mockSendSlack,
    now: () => FIXED_NOW,
    ...overrides,
  };
}
```

---

## テストシナリオ一覧

### Suite 1: `dispatchSchemaAliasRollbackNotification` — 4コアシナリオ

#### シナリオ 1-1: Slack 送信成功 → `sent/slack`

```
入力:
  deps.slackWebhookUrl = "https://hooks.slack.com/test-webhook"
  deps.sendSlack = mockSendSlack（ok: true を返す）
  payload = basePayload

期待結果:
  result.status === "sent"
  result.channel === "slack"
  result.attempts >= 1
  result.errorClass === null
  mockSendSlack が1回呼ばれたこと
  mockMailSender.send が呼ばれないこと
```

#### シナリオ 1-2: Slack 失敗 → mail fallback 成功 → `sent/mail`

```
入力:
  deps.slackWebhookUrl = "https://hooks.slack.com/test-webhook"
  deps.sendSlack = mockSendSlack（ok: false, status: 500 を返す）
  deps.mailSender = mockMailSender（send が { success: true } を返す）
  deps.opsEmail = "ops@example.com"
  payload = basePayload

期待結果:
  result.status === "sent"
  result.channel === "mail"
  result.attempts >= 1
  result.errorClass を含むか null（Slack 失敗は記録されないか errorClass に集約）
  mockSendSlack が1回以上呼ばれたこと
  mockMailSender.send が1回呼ばれたこと
```

#### シナリオ 1-3: Slack 失敗 + mail 失敗 → `failed/null`

```
入力:
  deps.slackWebhookUrl = "https://hooks.slack.com/test-webhook"
  deps.sendSlack = mockSendSlack（ok: false, status: 500 を返す）
  deps.mailSender = mockMailSender（send が reject/throw する）
  deps.opsEmail = "ops@example.com"
  payload = basePayload

期待結果:
  result.status === "failed"
  result.channel === null
  result.errorClass !== null（sanitized token（例: "mail_provider_401"）等）
  result.attempts >= 1
  関数自体は throw しない（必ず RollbackNotificationResult を返す）
```

#### シナリオ 1-4: Slack/mail 両方未設定 → `skipped/null`（AC-5）

```
入力:
  deps = { now: () => FIXED_NOW }
  （slackWebhookUrl / mailSender / opsEmail いずれも未設定）
  payload = basePayload

期待結果:
  result.status === "skipped"
  result.channel === null
  result.attempts === 0
  result.errorClass === null
  mockSendSlack が呼ばれないこと
  mockMailSender.send が呼ばれないこと
```

---

### Suite 2: `buildRollbackNotificationPayload` — redaction 検証（AC-2）

#### シナリオ 2-1: payload に actor 生 email が含まれない

```
入力:
  result = {
    aliasId: "alias-abc-123",
    rolledBackAt: FIXED_NOW,
    relatedAuditId: "audit-uuid",
    newVersion: 2,
    impact: { affectedResponseCount: 5, recomputeRequired: true },
  }
  actorEmail = "admin@example.com"
  now = FIXED_NOW

期待結果:
  payload.aliasId === "alias-abc-123"
  payload.affectedResponseCount === 5
  payload.recomputeRequired === true
  payload.rolledBackAt === FIXED_NOW
  payload.actorRef に "admin@example.com" の文字列が含まれない
  payload.actorRef に "@example.com" の文字列が含まれない
  JSON.stringify(payload) に "admin@example.com" が含まれない
```

#### シナリオ 2-2: payload に stableKey が含まれない

```
入力: シナリオ 2-1 と同じ
期待結果: JSON.stringify(payload) に "stableKey" キーが含まれない
```

---

### Suite 3: `redactRollbackActor` — 入出力検証（AC-2）

| 入力 | 期待出力 | 備考 |
| --- | --- | --- |
| `"admin@example.com"` | `"admin:redacted"` | ローカル先頭2文字、ドメイン全マスク |
| `"a@b.com"` | `"a***@***"` | ローカル1文字（先頭1文字 + ***） |
| `""` | `"unknown"` | 空文字 |
| `"unknown"` | `"unknown"` | "unknown" はそのまま |
| `"user@domain.co.jp"` | `"us***@***"` | 多階層ドメインもマスク |

各ケースを個別の `it` ブロックに分割して記述する。

---

### Suite 4: `recordRollbackNotificationAudit` — audit contract 検証（AC-4）

#### シナリオ 4-1: after_json の構造検証（PII 非包含）

```
入力:
  db モック（D1 binding stub）
  input = {
    aliasId: "alias-abc-123",
    actor: "admin@example.com",
    result: { status: "sent", channel: "slack", attempts: 1, errorClass: null },
    now: FIXED_NOW,
  }

期待結果（db.prepare.bind.run 等の呼び出し検証）:
  呼び出された SQL の after_json パース後に以下を含む:
    status === "sent"
    channel === "slack"
    attempts === 1
    errorClass === null
    dispatchedAt !== undefined
  after_json に生の actor email が含まれない（actor は audit_log の actor_email カラムに記録されるが after_json には含まれない）
  action 引数が "schema_alias.rollback_notification" であること
  target_type 引数が "schema_alias" であること
  target_id 引数が "alias-abc-123" であること
```

> `DbCtx` の stub は D1 interface の `prepare().bind().run()` チェーンを `vi.fn()` でモック。
> 呼び出し引数を `toHaveBeenCalledWith` または `mock.calls` で検証する。

---

## Route 層 integration の予告

Phase 4 では route 層のテストは**記述しない**（Phase 6 で本実施）。ただし以下の統合シナリオ骨子を本ファイルに TODOコメントとして記しておく:

```typescript
// TODO(Phase 6): integration テスト
// シナリオ: POST /admin/schema/aliases/:aliasId/rollback
//   → rollback D1 commit 成功
//   → dispatchSchemaAliasRollbackNotification 呼び出し（best-effort）
//   → recordRollbackNotificationAudit が audit_log に記録
//   → レスポンスは 200（通知の成否に依存しない）
// 4 variant: sent/slack / sent/mail / failed / skipped
```

---

## command suite（RED 確認）

```bash
# RED 確認（実装モジュール未存在のため import エラーになること）
mise exec -- pnpm --filter @ubm-hyogo/api test -- apps/api/src/workflows/schemaAliasRollbackNotification.spec.ts

# 型チェック（RED: import 解決失敗を確認）
mise exec -- pnpm typecheck
```

**期待される結果**:
- `Cannot find module '../schemaAliasRollbackNotification'` または型エラーが発生する
- テストが 0 件 PASS、N 件 FAIL の状態になる
- これが RED 確認の完了条件

---

## 期待される成果物

| 成果物 | パス | 内容 |
| --- | --- | --- |
| テストファイル（RED） | `apps/api/src/workflows/schemaAliasRollbackNotification.spec.ts` | 上記シナリオ 1-1〜4-1 の全 it ブロック |
| RED 確認ログ | `outputs/phase-4/red-run-result.md` | `pnpm test` 実行結果の貼り付け（fail ログ確認） |

---

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| 設計シグネチャ | `phase-2-design.md` | 関数シグネチャ・型定義 |
| 設計レビュー申し送り | `outputs/phase-3/handoff-to-phase-4.md` | Phase 4 注意事項 |
| 既存 Slack sender | `apps/api/src/lib/slack-sender.ts` | `SendSlackResult` 型確認 |
| 既存 mail sender | `apps/api/src/services/mail/magic-link-mailer.ts` | `MailSendResult` / `MailSender` 型確認 |
| 既存 rollback workflow | `apps/api/src/workflows/schemaAliasRollback.ts` | `SchemaAliasRollbackResult` 型確認 |
| vitest 設定 | `apps/api/vitest.config.ts` | テスト実行設定確認 |

---

## 完了条件

- [ ] テストファイル `schemaAliasRollbackNotification.spec.ts` を作成した
- [ ] Suite 1（dispatch 4シナリオ）の it ブロックを全て記述した
- [ ] Suite 2（payload redaction 2シナリオ）の it ブロックを全て記述した
- [ ] Suite 3（redactRollbackActor 5ケース）の it ブロックを全て記述した
- [ ] Suite 4（audit contract 1シナリオ）の it ブロックを全て記述した
- [ ] Phase 6 route integration の TODO コメントを追記した
- [ ] RED 確認コマンドを実行し、テストが失敗（RED）であることを確認した
- [ ] `outputs/phase-4/red-run-result.md` に RED ログを記録した

---

## タスク100%実行確認【必須】

- [ ] 本Phase内の全タスクを100%実行完了
- [ ] 各タスクを100%完了し、完了を明記
- [ ] 成果物が全て生成されていることを確認

---

## 次Phase

`phase-5-implementation.md`（実装 GREEN）へ進む。全テストが RED であることを確認してから Phase 5 へ進む。
