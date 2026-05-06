# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-401-admin-request-notification |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-05-06 |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | spec_created |
| visualEvidence | NON_VISUAL |

## 目的

Issue #401 の admin resolve 後の member 通知を、実装着手可能な要件と AC に固定する。closed issue は reopen せず、起票元 `task-04b-admin-request-notification-001.md` を入力として、resolve transaction との疎結合・PII sanitize・retry/DLQ 方針を AC として番号化する。

## 実行タスク

1. P50 チェックとして既存 resolve API（`apps/api/src/routes/admin/requests.ts:237`）と `MailSender` abstraction（`apps/api/src/services/mail/magic-link-mailer.ts`）と auditLog repository を確認する
2. 通知チャネル決定: 一次チャネルを email（Resend 経由）に確定。Magic Link page state / in-app status は MVP 対象外
3. AC を Phase 7 で検証可能な番号付きとして定義
4. resolve transaction と通知 enqueue の疎結合不変条件を固定
5. PII sanitize 規約（200 文字 truncate / 制御文字除去 / `resolutionNote` 全文は ledger のみ）を固定
6. retry/backoff/DLQ 方針（exponential backoff / max_retries=5 / 終端 dlq）を固定

## AC（受入基準）

- AC-1: admin が resolve（approve / reject）した直後、対象 member の `responseEmail` 宛に approve/reject template の email が enqueue される
- AC-2: 同一 `(noteId, outcome)` の重複 enqueue は unique 制約により拒否される（idempotent enqueue）
- AC-3: enqueue 失敗（D1 書き込み失敗）が発生しても resolve API は 200 を返し、resolve transaction は rollback されない（best-effort + warning log）
- AC-4: dispatch worker は `pending` row を CAS で claim し（`pending → dispatching`）、二重送信を防ぐ
- AC-5: 送信成功時 `notification_outbox.status='sent'` + `notification_ledger` に sent record が書き込まれる
- AC-6: 送信失敗時 retry_count++ / next_attempt_at が exponential backoff（30s / 2m / 10m / 1h / 6h）で更新される
- AC-7: retry_count >= 5 で `dlq` に遷移し ledger に dlq record が記録される
- AC-8: email 本文に `resolutionNote` 生文字列が含まれない（template snapshot test で証明）
- AC-9: raw `resolutionNote` は admin note 境界に閉じ、email / `notification_outbox.reason_summary` / `notification_ledger.detail_json` にコピーしない
- AC-10: cron trigger（`*/5 * * * *`）が `wrangler.toml` で apps/api に登録される

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | AC を test matrix（contract / repository / workflow / dispatcher unit）に変換 |
| Phase 7 | AC matrix の正本 |
| Phase 11 | NON_VISUAL evidence（migration apply / dispatch tick log / DLQ サンプル） |

## 多角的チェック観点

- 真の論点: resolve の atomic 性を壊さずに「member への結果通知」をベスト・エフォートで成立させること
- 依存境界: schema 拡張は本タスクで完結（migration 0014）。resolve 本体は触らず enqueue 呼び出しを追加するのみ
- 価値とコスト: 配信ベンダ切替や UI 露出は別軸。本タスクは outbox + dispatcher 1 サイクルで MVP を成立させる

## 成果物

- `outputs/phase-01/main.md`（要件サマリ + AC 番号一覧）

## 完了条件

- [ ] AC-1〜AC-10 が定義されている
- [ ] 疎結合不変条件が明記されている
- [ ] PII sanitize 規約が明記されている
- [ ] retry/backoff/DLQ 方針が明記されている

## 次 Phase

次: 2 (設計)。schema / interface / 配信契約を固定する。

## 参照資料

- `docs/30-workflows/completed-tasks/task-04b-admin-request-notification-001.md`
- `.claude/skills/aiworkflow-requirements/references/api-endpoints.md`
