---
governance_mutation_user_gate: true
mutation_commands:
  - "bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging"
  - "bash scripts/cf.sh d1 execute ubm-hyogo-db-stg --env staging（staging rollback smoke 実行に伴う schema alias の D1 mutation）"
read_only_evidence_allowed_pre_gate: true
user_approval_marker: outputs/phase-13/user-approval-issue-838-followup-001-staging-rollback-notification-smoke-<timestamp>.md
---

# issue-838 schema alias rollback notification staging runtime smoke evidence 取得 - タスク指示書

## メタ情報

| 項目         | 内容                                                                                                                              |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| タスクID     | issue-838-followup-001-staging-rollback-notification-smoke                                                                       |
| issue_number | 908（https://github.com/daishiman/UBM-Hyogo/issues/908）                                                                         |
| タスク名     | `POST /admin/schema/aliases/:aliasId/rollback` の通知副作用に対する staging runtime smoke evidence 取得                          |
| 分類         | 検証（Runtime Evidence）                                                                                                         |
| 対象機能     | `apps/api` Cloudflare Workers / `POST /admin/schema/aliases/:aliasId/rollback` 成功後の best-effort 運用通知 + `audit_log` 記録 |
| 優先度       | 中                                                                                                                              |
| 見積もり規模 | 小規模                                                                                                                          |
| ステータス   | consumed_by_issue_838_runtime_pending                                                                                           |
| 発見元       | `docs/30-workflows/issue-838-schema-alias-rollback-notification/` Phase 11（`local_evidence_captured_runtime_pending`）        |
| 発見日       | 2026-05-24                                                                                                                      |
| source link  | [../issue-838-schema-alias-rollback-notification/outputs/phase-11/manual-test-result.md](../issue-838-schema-alias-rollback-notification/outputs/phase-11/manual-test-result.md) |

---

## なぜこのタスクが必要か（Why）

### 背景

親タスク `issue-838-schema-alias-rollback-notification`（schema alias rollback 成功後に Slack 優先 / mail fallback の best-effort 運用通知を送り、結果を `audit_log` の `action='schema_alias.rollback_notification'` として記録する機能）は Phase 1-12 まで完了している。focused unit + route test（`schemaAliasRollbackNotification.spec.ts` + `schema.rollback.spec.ts`、2 files / 13 tests）と `pnpm --filter @ubm-hyogo/api typecheck` はローカルで PASS 済み。

しかし Phase 11 は `local_evidence_captured_runtime_pending` ステータスで止まっており、**staging runtime での実通知 evidence（AC-6）が未取得**である。これは staging secrets 投入・`bash scripts/cf.sh deploy`・staging D1 の rollback 実行を伴う user-gated runtime 操作であり、ローカルでは完了できない。よって独立 followup として切り出す。

### 問題点・課題

- Cloudflare Workers ランタイムで `dispatchSchemaAliasRollbackNotification()` が実 Slack webhook / 実 mail provider を叩いて着信するかは、ローカル mock test では保証できない。
- `audit_log` への `schema_alias.rollback_notification` entry が実 D1（staging）で設計通り（`after_json={status,channel,attempts,errorClass,dispatchedAt}`）記録されるかは runtime でしか確認できない。
- config gate（`SLACK_WEBHOOK_URL` / `MAIL_PROVIDER_KEY` 未設定時に `status=skipped`）の挙動が、実 env 未設定状態で正しく `skipped/none/attempts=0` になるかの runtime 確認が未実施。
- best-effort 設計（通知失敗が rollback の 200 を壊さない）が、実 provider 失敗（4xx/5xx）でも崩れないことの runtime evidence がない。

### 放置した場合の影響

- 実運用で初めて rollback 通知が飛んだ瞬間に provider 4xx/5xx・secret 未投入・audit 記録漏れが起きても、通知側の不具合か env 設定漏れかの切り分けができない。
- Phase 13 PR / close-out で「AC-6 runtime evidence 不足」が後追い指摘され、再 deploy 待ちで close が遅延する。
- 同種先行例（`ut-17-followup-001-alert-relay-runtime-smoke-evidence`）に倣った staging smoke evidence の MD 化運用が issue-838 でも必要。

---

## 何を達成するか（What）

### 目的

staging にデプロイ済みの `apps/api` に対し、schema alias rollback を実行して best-effort 通知 dispatch と `audit_log` 記録を実機確認し、その evidence を tracked file（MD）として残す（AC-6 充足）。

### 最終ゴール

- staging smoke evidence MD: `docs/30-workflows/issue-838-schema-alias-rollback-notification/outputs/phase-11/evidence/staging-smoke.md`（tracked file・AC-6）
- 親タスク Phase 11 のステータスを `local_evidence_captured_runtime_pending` から runtime evidence 取得済みへ更新（`outputs/phase-11/manual-test-result.md`）。
- evidence MD に rollback 実行ログ・通知 dispatch 結果（`status`/`channel`/`attempts`）・`audit_log` の `schema_alias.rollback_notification` entry・config 未設定時の `skipped` 動作を記録。

### スコープ概要（詳細は末尾「スコープ」セクション）

staging での rollback smoke 実行と通知/audit の実機確認・evidence MD 化・親 Phase 11 ステータス更新のみ。通知 dispatch の実装変更は含まない（親 issue-838 で完了済み）。

---

## どのように実行するか（How）

### 前提条件

- 親タスク issue-838 のコード（`apps/api/src/workflows/schemaAliasRollbackNotification.ts` + route 改修）が staging の `apps/api` Worker にデプロイ済み。
- `SLACK_WEBHOOK_INCIDENT`（優先）または `SLACK_WEBHOOK_URL`（fallback）、必要なら `MAIL_PROVIDER_KEY` / `MAIL_FROM_ADDRESS` / `OPS_NOTIFICATION_EMAIL` が staging Cloudflare Secrets / vars に投入済み（実値は 1Password 正本・op 参照経由）。
- Slack 受信チャンネルが用意済み。
- staging D1 に rollback 対象の schema alias（テスト用）が存在する。

### 依存タスク

- 親: `issue-838-schema-alias-rollback-notification`（Phase 1-12 完了・runtime_pending）
- 影響先: issue-838 Phase 13 close-out

### 必要な知識・参照実装

- 通知 dispatch: `apps/api/src/workflows/schemaAliasRollbackNotification.ts`（`dispatchSchemaAliasRollbackNotification` / `buildRollbackNotificationPayload` / `redactRollbackActor` / `recordRollbackNotificationAudit`）
- route 発火点: `apps/api/src/routes/admin/schema.ts`（rollback route 末尾の best-effort 通知 + audit 記録）
- Cloudflare CLI は必ず `bash scripts/cf.sh` 経由（`wrangler` 直接実行禁止）

### 推奨アプローチ

1. staging deploy の最新性を確認（`bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging` 済みか）。
2. テスト用 schema alias を1件用意し、rollback を実行 → Slack 着信 + audit entry を確認。
3. config 未設定パターン（Slack/mail secret を一時的に外す or 未設定環境）で rollback → `status=skipped` を確認。
4. provider 失敗パターン（意図的に無効 webhook 等）で rollback → 通知 `failed` でも rollback 200 が返ることを確認。
5. 各結果を evidence MD に redact（webhook URL / token を伏せる）して記録。

---

## 実行手順（Phase 構成）

1. staging deploy 最新性確認 + テスト用 alias 準備
2. 正常系 rollback smoke 実行（通知 sent + audit 記録確認）
3. config 未設定 / provider 失敗系の smoke 実行（skipped / failed + rollback 200 維持確認）
4. evidence MD 作成 + 親 Phase 11 ステータス更新

---

## 苦戦箇所【記入必須】

親タスク issue-838 実装で実際に詰まった / 本 runtime smoke で詰まり得るポイントを、将来の同種タスク（best-effort 運用通知 + audit 記録系）で活かせる粒度で記録する。

- 対象: `apps/api/src/routes/admin/schema.ts`（rollback route 末尾）
  - 症状: best-effort 通知を rollback の D1 commit 内に置くと、通知失敗が rollback transaction を巻き込み 500 化する。
  - 対策/教訓: 通知 dispatch と audit insert を **route 層で二重 try/catch 隔離**し、D1 commit 完了後に発火する。issue #401（L-I401-001）の「enqueue を transaction 外に置く」設計を踏襲。

- 対象: `apps/api/src/repository/notificationOutbox.ts`（member 限定スキーマ）
  - 症状: 運用通知を既存 `notification_outbox`（`member_id`/`recipient_email` NOT NULL・`request_type` CHECK・`UNIQUE(note_id,outcome)`）に相乗りさせると破壊的変更が必要になる。
  - 対策/教訓: rollback 通知は **運用者向け**であり member outbox には乗せない。`audit_log` の `schema_alias.rollback_notification` action のみで充足（migration 不要）。

- 対象: `apps/api/src/workflows/schemaAliasRollbackNotification.ts`（redaction）
  - 症状: actor email / stableKey / webhook URL / token が通知 payload・mail HTML・audit `after_json` に漏れるリスク。
  - 対策/教訓: **3層 redaction**（payload 構築層で actor を `admin:redacted` 化 / 送信本文層で dynamic value を escape / audit 記録層で `after_json` を `{status,channel,attempts,errorClass,dispatchedAt}` のみに制限）。`errorClass` は sanitized token のみ。

- 対象: `dispatchSchemaAliasRollbackNotification()` の Slack→mail fallback
  - 症状: Slack 失敗時に mail を試行する際、`attempts` の合算（Slack 試行回数 + mail 試行回数）を誤ると audit の attempts が不正確になる。
  - 対策/教訓: fallback 経路でも attempts を累積し、最終 `RollbackNotificationResult.attempts` に正しく反映するテストを必須化。

- 対象: env 命名 drift
  - 症状: 旧仕様の `RESEND_API_KEY` を参照すると現行 env と乖離する。
  - 対策/教訓: 正本は `MAIL_PROVIDER_KEY`（+ `MAIL_FROM_ADDRESS` / `OPS_NOTIFICATION_EMAIL`）。Slack は `SLACK_WEBHOOK_INCIDENT` 優先 + `SLACK_WEBHOOK_URL` fallback。

- 対象: Cloudflare Workers isolate
  - 症状: 通知の重複抑止を in-memory 状態で行うと isolate 跨ぎで効かない（UT-17 alert-relay の既知制約と同型）。
  - 対策/教訓: rollback 通知は1操作1通知の単発であり dedup 不要だが、将来 bulk 化時は isolate 跨ぎ前提で KV/DO 設計にする。

- 対象: staging smoke 前提
  - 症状: staging に `SLACK_WEBHOOK_*` / `MAIL_*` secret が未投入だと、通知が常に `skipped` になり「正常系 sent」の evidence が空振りする。
  - 対策/教訓: smoke 実行前に `bash scripts/cf.sh` 経由で staging secret 投入状態を確認してから正常系を回す。

---

## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| staging secret 未投入で通知が常に `skipped` になり正常系 evidence が取れない | 中 | smoke 実行前に staging の `SLACK_WEBHOOK_*` / `MAIL_*` 投入状態を `bash scripts/cf.sh` で確認 |
| staging D1 の rollback 実行が他データへ波及 | 中 | 専用テスト schema alias を用意し、対象 aliasId を限定して rollback。実行前後で `audit_log` を確認 |
| 実 secret 値（webhook URL / token）を evidence MD やログに転記 | 高 | curl / dispatch ログの webhook URL・Authorization・token を redact。CLAUDE.md シークレット管理ルール準拠（実値は op 参照のみ） |
| provider 失敗系テストで本物の障害と区別がつかない | 低 | 失敗系は意図的に無効値を使い、evidence MD に「意図的 failure 注入」と明記 |
| user-gated mutation（deploy / D1 rollback）を AI が無断実行 | 高 | 冒頭 YAML `governance_mutation_user_gate: true`。mutation はユーザー承認後のみ。read-only evidence（status 確認等）は事前取得可 |

---

## 検証方法

### 単体検証（ローカル・事前確認）

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/api/src/workflows/schemaAliasRollbackNotification.spec.ts \
  apps/api/src/routes/admin/__tests__/schema.rollback.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
```

期待: 2 files / 全テスト PASS（Slack success / mail fallback / skipped / failed / audit payload redaction / route skipped-notification regression）、typecheck PASS。

### 統合検証（staging runtime・user-gated）

```bash
# staging deploy（user 承認後）
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging

# rollback 実行後に audit entry を確認（read-only）
bash scripts/cf.sh d1 execute ubm-hyogo-db-stg --env staging \
  --command "SELECT action, target_type, target_id, after_json, created_at FROM audit_log WHERE action='schema_alias.rollback_notification' ORDER BY created_at DESC LIMIT 5;"
```

期待:
- 正常系: Slack チャンネルに rollback 通知が着信し、`audit_log` に `schema_alias.rollback_notification`（`after_json.status='sent'` / `channel='slack' or 'mail'`）が記録される。
- config 未設定系: `after_json.status='skipped'` / `channel='none'` / `attempts=0`。
- provider 失敗系: `after_json.status='failed'`（sanitized `errorClass`）だが rollback API は HTTP 200 を返す。
- evidence MD（`outputs/phase-11/evidence/staging-smoke.md`）が tracked file として残る。

失敗時の切り分け: 通知が来ない場合は staging secret 投入状態 → route 発火点（`schema.ts`）→ dispatch ログの順で確認。

---

## スコープ

### 含む

- staging にデプロイ済み `apps/api` での schema alias rollback smoke 実行
- 正常系（通知 sent）/ config 未設定系（skipped）/ provider 失敗系（failed + rollback 200 維持）の 3 パターン runtime 確認
- `audit_log` の `schema_alias.rollback_notification` entry の実機確認
- staging smoke evidence MD（`outputs/phase-11/evidence/staging-smoke.md`）作成
- 親タスク Phase 11 ステータス更新（runtime evidence 取得済みへ）

### 含まない

- 通知 dispatch / redaction / audit 記録の実装変更（→ 親 `issue-838-schema-alias-rollback-notification` で完了済み）
- bulk rollback の通知（→ `serial-05-step-03-followup-006-schema-alias-bulk-rollback.md` で別管理）
- rollback 後の集計再実行（response_fields reverse-backfill）（→ issue #836 で別管理）
- member 向け `notification_outbox` の generic 化（運用者通知は対象外・破壊的変更回避のため本タスクでも触らない）
- production 環境での smoke（staging で AC-6 を充足。production は別途 release gate で判断）

---

## 参照

### 関連ドキュメント

- 親タスク: `docs/30-workflows/issue-838-schema-alias-rollback-notification/index.md`
- 親 Phase 10 最終レビュー: `docs/30-workflows/issue-838-schema-alias-rollback-notification/outputs/phase-10/final-review-result.md`
- 親 Phase 11 手動テスト結果: `docs/30-workflows/issue-838-schema-alias-rollback-notification/outputs/phase-11/manual-test-result.md`
- 親 Phase 12 実装ガイド: `docs/30-workflows/issue-838-schema-alias-rollback-notification/outputs/phase-12/implementation-guide.md`
- 旧仕様書（実装完了で消化）: `docs/30-workflows/unassigned-task/serial-05-step-03-followup-007-schema-alias-rollback-notification.md`
- 同種 runtime-evidence followup 先行例: `docs/30-workflows/unassigned-task/ut-17-followup-001-alert-relay-runtime-smoke-evidence.md`

### 関連実装

- `apps/api/src/workflows/schemaAliasRollbackNotification.ts`
- `apps/api/src/routes/admin/schema.ts`
- `apps/api/src/lib/slack-sender.ts`
- `apps/api/src/services/mail/magic-link-mailer.ts`

### 関連 issue

- 親: #838（CLOSED・schema alias rollback 通知）
- 本タスク: #908
