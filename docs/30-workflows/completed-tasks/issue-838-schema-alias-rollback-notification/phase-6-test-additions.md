# Phase 6: テスト拡充 - タスク仕様書

## メタ情報

| 項目 | 内容 |
| --- | --- |
| Phase | 6 |
| Phase名 | テスト拡充 |
| 前提Phase | Phase 5（実装 GREEN 完了） |
| 後続Phase | Phase 7 |
| ステータス | completed |
| 作成日 | 2026-05-24 |
| 機能名 | issue-838-schema-alias-rollback-notification |
| 実装区分 | 実装仕様書 |

---

## 目的

Phase 4 で書いた 4 コアシナリオに加え、fail path・errorClass 分岐・回帰 guard・route 層 integration（rollback route → dispatch → audit の E2E）を追加し、受入条件 AC-1〜AC-7 の全件をテストで担保する。

---

## 実行タスク

| # | タスク | 詳細セクション |
| --- | --- | --- |
| 1 | errorClass 分岐の fail path テスト追加（slack 4xx/5xx/network・mail provider/network） | 「Suite 5」 |
| 2 | mail のみ config gate テスト追加 | 「Suite 6」 |
| 3 | audit contract（failed / skipped バリアント）テスト追加 | 「Suite 7」 |
| 4 | route integration（4 variant）テスト追加 | 「Suite 8」 |
| 5 | 既存 rollback / 通知基盤テストの回帰 guard 実行（AC-7） | 「Suite 9」 |

---

## 追加テスト対象

| テスト区分 | 対象 | 対応 AC |
| --- | --- | --- |
| fail path: errorClass 分岐 | `dispatchSchemaAliasRollbackNotification` | AC-3 |
| config gate: mail のみ設定 | `dispatchSchemaAliasRollbackNotification` | AC-1, AC-5 |
| mail unconfigured パターン | `dispatchSchemaAliasRollbackNotification` | AC-5 |
| audit contract: failed/skipped | `recordRollbackNotificationAudit` | AC-4 |
| route integration: 4 variant | `POST /admin/schema/aliases/:aliasId/rollback` | AC-1, AC-3, AC-4 |
| 既存 rollback テスト回帰 | `apps/api/src/workflows/__tests__/schemaAliasRollback.spec.ts` | AC-7 |
| 既存 Slack sender テスト回帰 | `apps/api/src/lib/__tests__/slack-sender.spec.ts` | AC-7 |

---

## テストファイル配置方針

- 既存テストファイルは**編集しない**（回帰 guard は実行のみ確認）
- 新規追加テストは Phase 4 で作成した `schemaAliasRollbackNotification.spec.ts` に Suite として追記する
- route integration テストは `apps/api/src/routes/admin/__tests__/schema-rollback-notification-integration.spec.ts` を**新規作成**する

---

## Suite 5: fail path — errorClass 分岐詳細（AC-3）

`apps/api/src/workflows/schemaAliasRollbackNotification.spec.ts` に追記。

### シナリオ 5-1: Slack 4xx → sanitized Slack 4xx errorClass

```
入力:
  deps.sendSlack = vi.fn(() => ({ ok: false, status: 403 }))
  mailSender 未設定

期待結果:
  result.status === "failed"
  result.errorClass is a sanitized non-secret token
```

### シナリオ 5-2: Slack 5xx → sanitized Slack 5xx errorClass

```
入力:
  deps.sendSlack = vi.fn(() => ({ ok: false, status: 503 }))
  mailSender 未設定

期待結果:
  result.status === "failed"
  result.errorClass is a sanitized non-secret token
```

### シナリオ 5-3: Slack fetch throw → errorClass `slack_network`

```
入力:
  deps.sendSlack = vi.fn(() => { throw new Error("network error") })
  mailSender 未設定

期待結果:
  result.status === "failed"
  result.errorClass === "slack_network"
  関数は throw しない（必ず result を返す）
```

### シナリオ 5-4: mail provider error → sanitized mail provider errorClass

```
入力:
  deps.slackWebhookUrl 未設定
  deps.mailSender.send = vi.fn(() => { throw new Error("Resend API error") })
  deps.opsEmail = "ops@example.com"

期待結果:
  result.status === "failed"
  result.errorClass starts with "mail_provider_" or is a sanitized token
```

### シナリオ 5-5: mail network error → errorClass `mail_network`（実装依存）

```
入力:
  deps.slackWebhookUrl 未設定
  deps.mailSender.send = vi.fn(() => { throw new TypeError("Failed to fetch") })
  deps.opsEmail = "ops@example.com"

期待結果:
  result.status === "failed"
  result.errorClass が a sanitized non-secret token のいずれか
  （実装の sanitize 関数に合わせて expect を確定する）
```

---

## Suite 6: config gate — mail のみ設定パターン（AC-1, AC-5）

### シナリオ 6-1: slackWebhookUrl 未設定 + mail 設定あり → mail 送信を試行

```
入力:
  deps = { mailSender: { send: vi.fn(() => ({ success: true })) }, opsEmail: "ops@example.com" }

期待結果:
  result.status === "sent"
  result.channel === "mail"
  deps.sendSlack（または mockSendSlack）が呼ばれない
```

### シナリオ 6-2: opsEmail 未設定（mail 不完全設定） → mail は試行しない

```
入力:
  deps = { mailSender: { send: vi.fn() }, opsEmail: undefined }
  slackWebhookUrl 未設定

期待結果:
  result.status === "skipped"（両方の config gate が false のため）
  deps.mailSender.send が呼ばれない
```

---

## Suite 7: audit contract — failed/skipped バリアント（AC-4）

`schemaAliasRollbackNotification.spec.ts` に追記（Suite 4 の拡充）。

### シナリオ 7-1: status=failed の audit 記録

```
入力:
  result = { status: "failed", channel: "none", attempts: 2, errorClass: "slack_status_500" }

期待結果:
  after_json の status === "failed"
  after_json の errorClass is a sanitized non-secret token
  after_json に生 actor email が含まれない
  action === "schema_alias.rollback_notification"
```

### シナリオ 7-2: status=skipped の audit 記録

```
入力:
  result = { status: "skipped", channel: "none", attempts: 0, errorClass: null }

期待結果:
  after_json の status === "skipped"
  after_json の errorClass === null（または JSON 上 null）
```

---

## Suite 8: route integration — 4 variant（AC-1, AC-3, AC-4）

**テストファイル**: `apps/api/src/routes/admin/__tests__/schema-rollback-notification-integration.spec.ts`

このファイルでは Hono app の `testClient` またはモック fetch を使い、rollback route を実際に呼び出してレスポンスと audit 記録の両方を検証する。

> D1 は `D1MockDatabase`（または `@cloudflare/vitest-pool-workers` の miniflare D1 インスタンス）でスタブする。vitest 設定で cloudflare pool が有効か確認し、適切なスタブ方法を採用する。

### シナリオ 8-1: rollback 成功 + Slack 通知成功 → 200 + audit `sent/slack`

```
セットアップ:
  sendSlack mock: ok=true
  DB mock: rollback 成功、audit insert 受け付け
  env: SLACK_WEBHOOK_URL あり

実行: POST /admin/schema/aliases/alias-abc/rollback

期待結果:
  HTTP 200
  レスポンス body に rollback result が含まれる
  D1 に audit_log insert が呼ばれた（action="schema_alias.rollback_notification", after_json.status="sent"）
```

### シナリオ 8-2: rollback 成功 + Slack 失敗 → mail fallback 成功 → 200 + audit `sent/mail`

```
セットアップ:
  sendSlack mock: ok=false, status=500
  mailSender.send mock: success=true
  env: SLACK_WEBHOOK_URL あり、MAIL_PROVIDER_KEY あり、OPS_NOTIFICATION_EMAIL あり

実行: POST /admin/schema/aliases/alias-abc/rollback

期待結果:
  HTTP 200
  audit after_json.status === "sent"
  audit after_json.channel === "mail"
```

### シナリオ 8-3: rollback 成功 + 両 channel 失敗 → 200 + audit `failed`（AC-3 検証）

```
セットアップ:
  sendSlack mock: ok=false, status=500
  mailSender.send mock: throw

実行: POST /admin/schema/aliases/alias-abc/rollback

期待結果:
  HTTP 200（通知失敗でも rollback は 200 を返す ← AC-3 の核心）
  audit after_json.status === "failed"
```

### シナリオ 8-4: rollback 成功 + channel 未設定 → 200 + audit `skipped`（AC-5 検証）

```
セットアップ:
  env: SLACK_WEBHOOK_URL なし、MAIL_PROVIDER_KEY なし

実行: POST /admin/schema/aliases/alias-abc/rollback

期待結果:
  HTTP 200
  audit after_json.status === "skipped"
```

---

## Suite 9: 既存テスト回帰 guard（AC-7）

以下のテストを実行し、全件 PASS であることを確認する。**このSuiteでテストを新規作成しない**（実行確認のみ）。

| テストファイル | 確認内容 |
| --- | --- |
| `apps/api/src/workflows/__tests__/schemaAliasRollback.spec.ts` | rollback 本体の既存テストが回帰しない |
| `apps/api/src/lib/__tests__/slack-sender.spec.ts` | Slack 送信基盤の既存テストが回帰しない（存在する場合） |
| `apps/api/src/services/mail/__tests__/*.spec.ts` | mail 送信基盤の既存テストが回帰しない（存在する場合） |

```bash
# 回帰確認コマンド
mise exec -- pnpm --filter @ubm-hyogo/api test
```

---

## ローカル実行コマンド（CONST_005）

| コマンド | 目的 |
| --- | --- |
| `mise exec -- pnpm --filter @ubm-hyogo/api test -- apps/api/src/workflows/schemaAliasRollbackNotification.spec.ts` | Suite 1〜7 の全実行 |
| `mise exec -- pnpm --filter @ubm-hyogo/api test -- apps/api/src/routes/admin/__tests__/schema-rollback-notification-integration.spec.ts` | Suite 8 integration のみ実行 |
| `mise exec -- pnpm --filter @ubm-hyogo/api test` | apps/api 全テスト（回帰確認含む） |
| `mise exec -- pnpm typecheck` | 型チェック |
| `mise exec -- pnpm lint` | リント |

---

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| Phase 4 テスト | `phase-4-test-plan.md` | 拡充元テスト一覧 |
| Phase 5 実装 | `phase-5-implementation.md` | errorClass sanitize 実装詳細 |
| Slack sender | `apps/api/src/lib/slack-sender.ts` | retry / `SendSlackResult` |
| vitest 設定 | `apps/api/vitest.config.ts` | cloudflare pool 設定確認 |
| 既存 rollback テスト | `apps/api/src/workflows/__tests__/schemaAliasRollback.spec.ts` | 回帰対象（Read して構造把握） |

---

## 成果物

| 成果物 | パス | 内容 |
| --- | --- | --- |
| 拡充 unit テスト | `apps/api/src/workflows/schemaAliasRollbackNotification.spec.ts` | Suite 5〜7（errorClass / config gate / audit contract）追記 |
| route integration テスト | `apps/api/src/routes/admin/__tests__/schema-rollback-notification-integration.spec.ts` | Suite 8（4 variant）新規 |
| 回帰確認記録 | `outputs/phase-6/test-additions-result.md` | 拡充テスト + 既存回帰の全件 PASS 結果 |

---

## 完了条件

- [ ] Suite 5（errorClass 分岐: シナリオ 5-1〜5-5）を追記・PASS 確認した
- [ ] Suite 6（config gate mail のみ: シナリオ 6-1〜6-2）を追記・PASS 確認した
- [ ] Suite 7（audit contract failed/skipped: シナリオ 7-1〜7-2）を追記・PASS 確認した
- [ ] Suite 8（route integration: シナリオ 8-1〜8-4）を新規ファイルで作成・PASS 確認した
- [ ] Suite 9 の回帰確認（既存テスト全件 PASS）を実施した
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/api test` が全件 PASS になった
- [ ] 確認結果を `outputs/phase-6/test-additions-result.md` に記録した

---

## タスク100%実行確認【必須】

- [ ] 本Phase内の全タスクを100%実行完了
- [ ] 各タスクを100%完了し、完了を明記
- [ ] 成果物が全て生成されていることを確認

---

## 次Phase

`phase-7-coverage.md`（カバレッジ確認）へ進む。全テスト PASS を確認してから Phase 7 へ進む。
