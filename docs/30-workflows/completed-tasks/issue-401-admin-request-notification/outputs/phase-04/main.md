# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略 |
| 前 Phase | 3 (アーキ確認) |
| 次 Phase | 5 (実装) |
| 状態 | spec_created |

## 目的

AC-1〜AC-10 を test matrix に変換し、追加するテストファイル・ケース・期待値を確定する。

## テストマトリクス

| AC | テスト種別 | ファイル | ケース要約 |
| --- | --- | --- | --- |
| AC-1 | contract | `apps/api/src/routes/admin/requests.test.ts` (拡張) | resolve 200 後に outbox row 1 件 (`status=pending`, `outcome=approved/rejected`) が作成される |
| AC-2 | repository | `apps/api/src/repository/__tests__/notificationOutbox.test.ts` | 同一 `(noteId, outcome)` の二度目 enqueue が `{ ok: false, reason: "duplicate" }` を返す |
| AC-3 | contract | `apps/api/src/routes/admin/requests.test.ts` (拡張) | enqueue が throw しても resolve API が 200 を返す（mock outbox で throw 注入）。resolve transaction 状態（`request_status='resolved'`）は維持 |
| AC-4 | repository | `notificationOutbox.test.ts` | `claimNextBatch` が `pending` を `dispatching` へ CAS 遷移、二度目の claim は同 row を返さない |
| AC-5 | workflow | `apps/api/src/workflows/notificationDispatchTick.test.ts` | dispatcher mock が ok を返す → row=`sent`, ledger に `sent` event |
| AC-6 | workflow | `notificationDispatchTick.test.ts` | dispatcher mock が retryable failure → retry_count++, next_attempt_at が backoffSchedule[0]=30s 進む |
| AC-7 | workflow | `notificationDispatchTick.test.ts` | retry_count=4 + retryable failure → retry_count=5, status=`dlq`, ledger に `dlq` event |
| AC-8 | unit / route | `apps/api/src/services/notification/__tests__/templates.test.ts`, `apps/api/src/routes/admin/requests.test.ts` | template は raw `resolutionNote` を受け取らず、route は reject `resolutionNote` を `reason_summary` にコピーしない |
| AC-9 | unit | `templates.test.ts` | `sanitizeRejectionNote` が制御文字除去 + 200 char truncate + trim を行う |
| AC-10 | static | `apps/api/wrangler.toml` 検証 + `apps/api/src/index.ts` scheduled handler test | cron 設定 grep + scheduled handler が `notificationDispatchTick` を呼ぶ分岐 test |

## モック / fixture 戦略

- D1: `apps/api/src/jobs/__fixtures__/d1-fake.ts` を再利用（既存 fake D1 + `prepare/run/all`）
- MailSender: テスト専用 fake `{ sent: MailMessage[]; nextResult: MailSendResult }` を `__fixtures__/fake-mail-sender.ts` に新規（dispatcher テストで使用）
- 時刻: deps.now を固定値で注入（backoff 計算検証のため）
- ulid: `notificationId` 生成は dependency injection で固定値化（test 時）

## ネガティブテスト

- D1 unique 制約違反 → `enqueue` が `duplicate` を返すことを検証（実 D1 fake で sql 実行）
- dispatcher が 4xx / 5xx を返すケースを retryable=false / true で分岐
- `responseEmail` が NULL の member → enqueue 時点で skip + warning log（resolve は成功）

## カバレッジ目標

| ファイル | branch | line |
| --- | --- | --- |
| `notificationOutbox.ts` | ≥80% | ≥85% |
| `services/notification/templates.ts` | ≥85% | ≥90% |
| `services/notification/dispatcher.ts` | ≥80% | ≥85% |
| `workflows/notificationDispatchTick.ts` | ≥80% | ≥85% |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | このマトリクスを正本として AC × test ファイルの突合表を生成 |
| Phase 9 | coverage を vitest run で計測 |
| Phase 11 | NON_VISUAL evidence として test 実行ログ・coverage レポートを保存 |

## 成果物

- `outputs/phase-04/main.md`（test matrix 詳細 / fixture 一覧 / coverage 目標）

## 完了条件

- [ ] AC-1〜AC-10 すべてに対応テストが割り当てられている
- [ ] coverage 目標が固定されている
- [ ] fake fixture の所在が決まっている

## 次 Phase

次: 5 (実装: migration / repository / route enqueue)。

## 実行タスク

1. AC を test matrix へ変換する
2. mock / fixture / coverage gate を固定する

## 参照資料

- `phase-01.md`
- `phase-07.md`
