# issue-838: schema alias rollback 発生時の通知 — タスク仕様書

> **[実装区分: 実装仕様書]** — コード変更を伴う（CONST_004 デフォルト）。
> 判定根拠: 本タスクの目的「rollback 発生時に運用通知を送る」は、新規 workflow モジュール・route 改修・テスト追加というコード変更なしには達成できない。issue 本文・参照仕様書にもファイル変更・関数追加が含意される。よって実装仕様書として作成する。

---

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | issue-838-schema-alias-rollback-notification |
| issue | https://github.com/daishiman/UBM-Hyogo/issues/838（CLOSED のまま。クローズ状態を維持して仕様書を作成） |
| 発見元 | `docs/30-workflows/completed-tasks/issue-778-schema-alias-rollback-undo/` Phase 12 |
| 旧仕様書 | `docs/30-workflows/unassigned-task/serial-05-step-03-followup-007-schema-alias-rollback-notification.md` |
| 作成日 | 2026-05-24 |
| 実装区分 | 実装仕様書（コード変更を伴う） |
| implementation_mode | `new`（新規実装。rollback 通知は未実装であることを P50 で確認済み） |
| task_type | feat |
| visual_category | NON_VISUAL（apps/api のみ。UI/UX 変更なし） |
| scale | medium |
| 想定スコープ | 1 実装サイクルで完了（CONST_007）。先送りタスクなし。 |

---

## issue 現状調査の結論（最新コードへの最適化）

issue #838 はクローズ済みだが、**rollback 通知機能はコードベース上で未実装**であることを確認した（P50 調査）。

| 確認項目 | 結果 | 根拠 |
| --- | --- | --- |
| rollback 本体 | 実装済み | `apps/api/src/workflows/schemaAliasRollback.ts`、route `apps/api/src/routes/admin/schema.ts:381` |
| rollback 完了時の通知発火 | **なし** | rollback route は `schemaAliasRollback()` 呼び出し後 `c.json(result)` のみ |
| 汎用 Slack 送信基盤 | 存在（#860 / UT-17） | `apps/api/src/lib/slack-sender.ts` `sendSlackMessage()` |
| 汎用 mail 送信基盤 | 存在（#401 / #55） | `apps/api/src/services/mail/magic-link-mailer.ts` `MailSender` / `createResendSender()` |
| member 向け outbox | 存在（#401 / #55） | `apps/api/src/repository/notificationOutbox.ts`（member 限定スキーマ） |
| audit log の notification status | **なし** | `audit_log` に notification status カラム・関連 entry なし |

### issue を現在のコードに最適化した根本解決の方針

issue #838 起票時点（2026-05-19）は「通知チャネル未確定」が主な未決事項だった。現在のコードでは以下が確立済みで、その前提が解消されている:

1. **Slack 送信経路**: `sendSlackMessage()`（指数バックオフ retry・429/5xx リトライ）— UT-17 / #860
2. **mail 送信経路**: `MailSender` / `createResendSender()`（Resend API・config gate）— #401 / #55
3. **best-effort auxiliary sink パターン**: issue #588（fallback-alert-slack-mail-extension）が「GitHub Issue / audit = required audit sink、Slack / mail = best-effort auxiliary sink、try/catch 隔離、redaction 二重防御」を確立
4. **enqueue を transaction 外に置く設計**: issue #401（L-I401-001）が確立

これを踏まえ、**rollback 通知は「best-effort auxiliary 運用通知」として実装する**。詳細な設計判断と不採用案は Phase 2 / Phase 3 を参照。要点:

- rollback は **admin 操作**であり、通知対象は**運用者**（member ではない）。よって member 限定スキーマの `notification_outbox`（`member_id` / `recipient_email` NOT NULL、`request_type` CHECK、`UNIQUE(note_id, outcome)`）には乗せない（破壊的変更回避・整合性維持）。
- rollback は既に `audit_log` に `schema_alias.rollback` を記録済み = **required audit sink は確立済み**。本タスクで追加するのは best-effort 運用通知 sink（Slack 優先 + mail fallback）と、その**結果を別 audit entry（`schema_alias.rollback_notification`）として併記する**ことのみ。
- 通知発火は rollback の D1 batch commit **後**に route 層で try/catch 隔離して行う。通知失敗は rollback result（200）を壊さない（受入条件「notification failure が rollback transaction を壊さない」を構造的に保証）。
- migration 不要（`audit_log` の既存スキーマで `action` を追加するのみ）。

---

## スコープ

### 含む

- 新規 workflow モジュール `schemaAliasRollbackNotification.ts`: best-effort 通知 dispatch（Slack 優先 + mail fallback）、redaction、status 返却
- rollback route（`apps/api/src/routes/admin/schema.ts`）の改修: rollback 成功後に通知を best-effort 発火し、結果を `schema_alias.rollback_notification` audit entry として記録
- 通知 payload の secret / PII redaction（actor email / stableKey をマスク）
- 通知 channel の config gate（`SLACK_WEBHOOK_URL` / `MAIL_PROVIDER_KEY` 未設定時は skip）
- unit / contract / integration テスト追加
- env 参照（`apps/api/wrangler.toml` vars / `.dev.vars.example`）の通知設定追記

### 含まない（理由付き・先送りではなく本質的にスコープ外）

- rollback / undo 本体（issue #778 で完了済み）
- 集計再実行（issue #836 / followup-005 で別管理）
- bulk rollback（followup-006 で別管理）
- member 向け `notification_outbox` の generic 化（本タスクの対象は運用者通知であり、member outbox 変更は不要かつ破壊的。Phase 2 で不採用理由を明記）
- 新規 D1 テーブル / migration（`audit_log` 既存スキーマで充足するため不要）

> CONST_007 準拠: 上記「含まない」はいずれも独立した完了済み/別 issue の領域であり、本タスクを 1 サイクルで完了させても破綻しない。先送りした作業は存在しない。

---

## 受入条件（issue #838 由来 + 本タスクで具体化）

- AC-1: rollback 成功時に Slack（優先）または mail（fallback）へ運用通知が送られる
- AC-2: 通知 payload に secret / PII（actor email 生値・stableKey 生値・token）が含まれない
- AC-3: notification failure（Slack 4xx/5xx・mail provider error・config 未設定）が rollback transaction を壊さず、rollback result（200）が返る
- AC-4: notification status（`sent` / `failed` / `skipped`）が `schema_alias.rollback_notification` audit entry に併記される
- AC-5: 通知 channel が未設定（`SLACK_WEBHOOK_URL` / `MAIL_PROVIDER_KEY` いずれも無し）の場合は status `skipped` で記録し、エラーにしない
- AC-6: runtime smoke evidence（staging で rollback → 通知 dispatch を確認）が tracked file として残る
- AC-7: 既存 rollback テスト・既存通知基盤テストが回帰しない

---

## 不変条件の遵守

| CLAUDE.md 不変条件 | 本タスクでの遵守方法 |
| --- | --- |
| #5 D1 直接アクセスは apps/api に閉じる | 通知 audit 記録は apps/api 内のみ |
| 既存 API endpoint surface のみ | 新規 endpoint を追加しない。rollback route の内部処理のみ拡張 |
| secret は Cloudflare Secrets / op 参照 | `SLACK_WEBHOOK_URL` / `MAIL_PROVIDER_KEY` は既存 secret を再利用。`.dev.vars.example` には op 参照のみ |
| `*.spec.ts` のみ | 新規テストは `*.spec.ts` |

---

## Phase 構成

| Phase | ファイル | 目的 | ステータス |
| --- | --- | --- | --- |
| 1 | `phase-1-requirements.md` | 要件定義・inventory・命名規則・P50・AC 確定 | completed |
| 2 | `phase-2-design.md` | 設計（採用案 A / 不採用案 B、関数シグネチャ、データ構造、redaction、config gate） | completed |
| 3 | `phase-3-design-review.md` | 設計レビューゲート（PASS/MINOR/MAJOR） | completed |
| 4 | `phase-4-test-plan.md` | テスト作成（RED）・command suite・expected result | completed |
| 5 | `phase-5-implementation.md` | 実装（GREEN）・変更/新規ファイル一覧 | completed |
| 6 | `phase-6-test-additions.md` | テスト拡充（fail path・回帰 guard） | completed |
| 7 | `phase-7-coverage.md` | カバレッジ確認（変更行 line/branch 実測） | completed |
| 8 | `phase-8-refactor.md` | リファクタリング | completed |
| 9 | `phase-9-qa.md` | 品質保証（typecheck / lint / 全テスト） | completed |
| 10 | `phase-10-final-review.md` | 最終レビューゲート | completed |
| 11 | `phase-11-manual-test.md` | 手動テスト（NON_VISUAL・staging smoke evidence） | runtime_pending |
| 12 | `phase-12-documentation.md` | ドキュメント更新・spec sync・未タスク・feedback | completed |
| 13 | `phase-13-pr.md` | PR 作成（ユーザー明示承認後のみ） | pending |

> ゲート: Phase 1-3（設計）完了まで Phase 4 へ進まない（CONST_001）。

---

## 主要参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| rollback 本体 | `apps/api/src/workflows/schemaAliasRollback.ts` | rollback workflow（編集対象外。通知は route 層で発火） |
| rollback route | `apps/api/src/routes/admin/schema.ts` | rollback route（編集対象） |
| Slack 送信 | `apps/api/src/lib/slack-sender.ts` | `sendSlackMessage()`（再利用） |
| mail 送信 | `apps/api/src/services/mail/magic-link-mailer.ts` | `MailSender` / `createResendSender()`（再利用） |
| best-effort パターン | `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-issue-588-fallback-alert-slack-mail-extension-2026-05.md` | best-effort sink / redaction 二重防御 |
| outbox 設計制約 | `.claude/skills/aiworkflow-requirements/references/lessons-learned-issue-401-admin-request-notification-2026-05.md` | enqueue を transaction 外に置く |
| audit log schema | `apps/api/migrations/0003_auth_support.sql` | `audit_log` DDL |
