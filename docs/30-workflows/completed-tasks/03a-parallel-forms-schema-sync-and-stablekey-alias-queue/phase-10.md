# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 03a-parallel-forms-schema-sync-and-stablekey-alias-queue |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビュー |
| Wave | 3 |
| Mode | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 9（品質保証） |
| 次 Phase | 11（手動 smoke） |
| 状態 | pending |

## 目的

GO / NO-GO を判定し、blocker と open question を整理する。上流 wave（02a / 02b / 01b）の AC が達成されていなければ NO-GO とする。

## 実行タスク

1. 上流 wave AC 達成状況を表化。
2. 自タスク AC-1〜AC-8 の green / red を確認。
3. blocker 一覧を整理。
4. GO / NO-GO 判定。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-07/ac-matrix.md | 自タスク AC |
| 必須 | doc/02-application-implementation/02a-parallel-member-identity-status-and-response-repository/index.md | 上流 AC |
| 必須 | doc/02-application-implementation/02b-parallel-meeting-tag-queue-and-schema-diff-repository/index.md | 上流 AC |
| 必須 | doc/02-application-implementation/01b-parallel-zod-view-models-and-google-forms-api-client/index.md | 上流 AC |
| 必須 | outputs/phase-09/free-tier-estimate.md | 無料枠 |

## 実行手順

### ステップ 1: 上流 AC 確認
- 02a / 02b / 01b の Phase 10 GO 状況を確認（無ければ pending として残す）。

### ステップ 2: 自タスク AC 確認
- AC-1〜AC-8 が phase-07 で green である。

### ステップ 3: blocker 抽出
- 上流タスクが完了していなければ blocker として記載。

### ステップ 4: GO/NO-GO
- blocker が 0 + 自タスク AC green → GO

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | smoke 実行可否 |
| Phase 13 | PR 作成可否 |
| Wave 8a | contract test の最終 green |

## 多角的チェック観点

| 観点 | 不変条件番号 | 適用理由 |
| --- | --- | --- |
| schema 集約 | #14 | endpoint が `/admin/*` のみ |
| 無料枠 | #10 | Phase 9 estimate を再確認 |
| stableKey 直書き禁止 | #1 | lint rule の存在 |
| apps/api | #5 | sync は apps/api 内 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 上流 AC 表化 | 10 | pending | 02a/02b/01b |
| 2 | 自 AC 確認 | 10 | pending | AC-1〜AC-8 |
| 3 | blocker 一覧 | 10 | pending | - |
| 4 | GO/NO-GO 判定 | 10 | pending | - |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/main.md | GO/NO-GO 判定 |
| メタ | artifacts.json | phase 10 を `completed` に更新 |

## 完了条件

- [ ] 上流 AC 状況 / 自 AC 状況 / blocker / 判定の 4 セクション
- [ ] GO の場合のみ Phase 11 へ進む

## タスク100%実行確認【必須】

- [ ] サブタスク 4 件すべて completed
- [ ] 上流 AC が表で可視化されている
- [ ] blocker が 0 のとき GO
- [ ] artifacts.json の phase 10 が `completed`

## 次 Phase

- 次: 11（手動 smoke）
- 引き継ぎ事項: GO 判定、smoke 対象
- ブロック条件: 上流 AC 未達 → NO-GO

## GO/NO-GO 判定

### 上流 wave AC 状況

| 上流タスク | 主 AC | 状態 |
| --- | --- | --- |
| 02a-parallel-member-identity-status-and-response-repository | repository unit test green / type test responseId !== memberId | pending（spec_created 完了前提） |
| 02b-parallel-meeting-tag-queue-and-schema-diff-repository | schema_versions / schema_questions / schema_diff_queue repository test green | pending（spec_created 完了前提） |
| 01b-parallel-zod-view-models-and-google-forms-api-client | googleFormsClient.getForm 戻り型 + auth test | pending（spec_created 完了前提） |

### 自タスク AC 状況

| AC | 状態 |
| --- | --- |
| AC-1〜AC-8 | Phase 7 で green |

### blocker 一覧

| # | 内容 | 解消条件 |
| --- | --- | --- |
| B-1 | 上流 02b の schema_diff_queue repository が pending | 02b Phase 10 GO |
| B-2 | 上流 01b の googleFormsClient が pending | 01b Phase 10 GO |

### 判定

- spec 単位: GO（仕様は完結、依存契約も矛盾なし）
- 実装単位: 上流 GO 待ち（B-1 / B-2）
- 結論: spec 完了として GO、実装着手は上流 GO 後

## open question

- alias テーブル（`schema_aliases`）の正式 DDL を 02b に追加する必要があるか確認（既出か未出か）
- back-fill 戦略（既存 response の stableKey 再マップ）は 07b に委譲で良いか
