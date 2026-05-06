# Phase 8: リファクタリング / DRY 化

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 8 / 13 |
| Phase 名称 | リファクタリング |
| 前 Phase | 7 (AC マトリクス) |
| 次 Phase | 9 (品質保証) |
| 状態 | spec_created |

## 目的

Phase 5/6 実装後にテスト全 PASS を維持しつつ、tagQueue retry pattern との重複・MailSender 抽象との結合度を見直す。

## 確認観点

| 観点 | 対応 |
| --- | --- |
| retry/backoff コード重複 | `tagQueueRetryTick` と `notificationDispatchTick` の backoff 計算ロジックが類似する場合、`packages/shared/src/retry/exponentialBackoff.ts` への抽出を検討（**今回は重複が小さいため抽出見送り**。観点として記録のみ） |
| MailSender 結合 | dispatcher は MailSender interface のみに依存し、Resend に直接依存しない（実装済） |
| ledger 書き込みの順序 | sent / failed / dlq いずれも outbox 状態遷移後に ledger を書く順序で統一（rollback 不要のため順序のみ） |
| `recipientEmail` 空ハンドリング | enqueue 内で skip + warning 統一、route 側では try/catch でログのみ |

## 実施するリファクタ

1. dispatcher の `buildMessage` 関数注入箇所が冗長な場合、`createMailDispatcher` 内で switch 化する選択肢を検討するが、テスト容易性のため**注入のままを維持**
2. `notificationOutbox.ts` の SQL 文字列をモジュール先頭に const として宣言（既存 repository pattern に整合）
3. `templates.ts` の固定文字列を named export（`APPROVED_VISIBILITY_TEXT` 等）に切り出し、test の snapshot 安定化

## 実施しないリファクタ（理由）

- 共通 retry helper への抽出: tagQueue 側のロジックも shape 違いがあり、抽出による複雑度が削減効果を上回る
- 通知チャネル抽象化（in-app / push 等）: MVP は email のみ、現時点で abstraction は YAGNI

## 成果物

- `outputs/phase-08/main.md`（リファクタ結果差分 / 見送り判断記録）

## 完了条件

- [ ] リファクタ後も全テスト PASS
- [ ] 見送り判断が記録されている

## 次 Phase

次: 9 (品質保証)。

## 実行タスク

1. 重複と過剰設計を削減する
2. 見送り判断を記録する

## 参照資料

- `phase-05.md`
- `phase-06.md`

## 統合テスト連携

リファクタ後も Phase 7 の AC matrix に対応する tests を通す。
