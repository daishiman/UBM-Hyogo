# Phase 3: アーキテクチャ確認

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 3 / 13 |
| Phase 名称 | アーキテクチャ確認 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (テスト戦略) |
| 状態 | spec_created |

## 目的

Phase 2 設計が CLAUDE.md 不変条件・既存パターン・他タスクとの整合性を満たすことを確認する。Phase 4 着手前のゲート。

## 不変条件チェック

| # | 不変条件 | 適合性 |
| --- | --- | --- |
| 1 | 実フォーム schema をコードに固定しすぎない | 関係なし（admin-managed data） |
| 2 | consent キー統一 | 関係なし |
| 3 | `responseEmail` を system field として扱う | 適合: repository は `member_identities.response_email` を recipient として読み出す（書き込みなし）。handler 内の架空 `member.responseEmail` 変数には依存しない |
| 4 | admin-managed data 分離 | 適合: `notification_outbox` / `notification_ledger` は admin-managed として独立。Google Form schema 領域に列を増やさない |
| 5 | D1 直接アクセスは apps/api に閉じる | 適合: dispatcher / outbox repository / workflow すべて apps/api 配下 |
| 6 | GAS prototype を昇格させない | 関係なし |
| 7 | Google Form 再回答を本人更新の正式経路 | 関係なし |

## 影響範囲

| レイヤ | 影響 | 種別 |
| --- | --- | --- |
| D1 schema | `notification_outbox` / `notification_ledger` 新規 | additive |
| Repository | `notificationOutbox.ts` 新規 | additive |
| Service | `services/notification/{templates,dispatcher}.ts` 新規 | additive |
| Workflow | `notificationDispatchTick.ts` 新規 | additive |
| Route | `routes/admin/requests.ts` の resolve 末尾に enqueue 呼出を追加 | minimally invasive |
| Cron | `wrangler.toml` triggers に cron entry 追加 | additive |
| Index | `apps/api/src/index.ts` の `scheduled` handler に dispatch tick 分岐追加 | minimally invasive |

resolve API 既存ロジック（D1 batch / `markResolved` / `markRejected` / 409 Conflict）には**一切手を入れない**。

## 既存パターンへの整合

- **retry/backoff/DLQ**: `tagQueueRetryTick.ts` を参照モデルとし、status enum・CAS claim・exponential backoff・max_retries=5・dlq 終端を踏襲
- **MailSender 抽象**: `magic-link-mailer.ts` の `MailSender` interface を再利用、`createResendSender` を本タスクでも採用
- **audit 書き込み**: `auditLog.ts` と同様の独立 ledger パターン（書き込み主体を repository に閉じる）
- **scheduled handler**: 既存 `tagQueueRetryTick` と同じ scheduled エントリで multi-tick 処理する（cron 重複起動を避ける）

## 疎結合性検証

| シナリオ | 期待挙動 |
| --- | --- |
| resolve 成功 + enqueue 成功 | resolve API 200, outbox row 作成 |
| resolve 成功 + enqueue 失敗（D1 書込エラー） | resolve API 200（warning log のみ）, outbox row なし → 後続 cron では拾えない、要監視 |
| resolve 失敗（409 等） | enqueue 呼ばれず、outbox row なし |
| dispatch 失敗（5xx） | retry_count++、resolve 状態には影響なし |
| dispatch 失敗（4xx） | retryable=false → 即 dlq、resolve 状態には影響なし |

「enqueue 失敗が監視対象になる」点は Phase 12 のドキュメントで運用手順に明記する。

## 多角的チェック

- 真の論点: enqueue 失敗の警告を運用が観測できる経路（log / Sentry）が確保されているか → 既存 logger / Sentry transport を再利用すれば足りる
- 因果境界: outbox は member への結果通知のみを責務に持つ。admin への通知（resolve 完了）は別軸（不要）
- 価値・コスト: provider 切替を抽象化済みのため将来コスト低い

## 成果物

- `outputs/phase-03/main.md`（不変条件チェック結果 / 既存パターン整合 / 疎結合シナリオ表）

## 完了条件

- [ ] CLAUDE.md 不変条件 #3-#5 への適合が確認されている
- [ ] 影響範囲が additive 中心で resolve 既存ロジックに侵襲がないことが確認されている
- [ ] 疎結合シナリオ表で AC-3 / AC-7 が破綻しないことが確認されている

## ゲート

Phase 1-3 すべて spec_created 完了でなければ Phase 4 に進まない。

## 次 Phase

次: 4 (テスト戦略)。

## 実行タスク

1. 不変条件と依存関係を確認する
2. 既存 mail / cron / retry pattern との整合を確認する

## 参照資料

- `docs/00-getting-started-manual/specs/07-edit-delete.md`
- `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md`

## 統合テスト連携

Phase 4 の negative tests で rollback なし / PII 非保存 / retry 再入口を検証する。
