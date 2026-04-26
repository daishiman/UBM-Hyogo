# Phase 7: AC マトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 03a-parallel-forms-schema-sync-and-stablekey-alias-queue |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス |
| Wave | 3 |
| Mode | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 6（異常系検証） |
| 次 Phase | 8（DRY 化） |
| 状態 | pending |

## 目的

Phase 1 AC × Phase 4 検証 × Phase 5 実装 × Phase 6 異常系の対応を 1 表に集約し、未対応 AC を 0 にする。

## 実行タスク

1. AC-1〜AC-8 ごとに verify / 実装関数 / failure case / 監査ログを matrix にまとめる。
2. 未対応 AC を抽出し、Phase 4 / 5 / 6 へフィードバックする（あれば）。
3. AC matrix を outputs/phase-07/ac-matrix.md に保存。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-01/main.md | AC 一覧 |
| 必須 | outputs/phase-04/test-matrix.md | test mapping |
| 必須 | outputs/phase-05/main.md | 関数 / runbook |
| 必須 | outputs/phase-06/failure-cases.md | failure case |

## 実行手順

### ステップ 1: matrix 作成
- 後述「AC matrix」を参照、独立ファイルにも保存。

### ステップ 2: 未対応抽出
- 全 AC が verify / impl / failure 列を持つことを確認する。
- 列が空白 → Phase 4 / 5 / 6 に追記要請を残す。

### ステップ 3: gate 評価
- 全 AC が green ならフェーズ 8 へ進む。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 8 | matrix を見て命名 / 型整理 |
| Phase 10 | gate 判定の根拠 |
| Wave 8a | contract test 設計の素材 |

## 多角的チェック観点

| 観点 | 不変条件番号 | 適用理由 |
| --- | --- | --- |
| stableKey 直書き | #1 | AC-7 を unit + lint で検証 |
| schema 集約 | #14 | AC-2 を queue 経由で確認 |
| 排他 | sync_jobs | AC-6 を 409 + ledger で確認 |
| 無料枠 | #10 | retry 戦略との整合 |
| 31 項目 | spec | AC-1 / AC-8 で count 強制 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC matrix 作成 | 7 | pending | 8 行 |
| 2 | 未対応抽出 | 7 | pending | 0 件目標 |
| 3 | matrix 独立保存 | 7 | pending | ac-matrix.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/main.md | サマリ |
| ドキュメント | outputs/phase-07/ac-matrix.md | matrix 表 |
| メタ | artifacts.json | phase 7 を `completed` に更新 |

## 完了条件

- [ ] AC-1〜AC-8 すべて 4 列（verify / impl / failure / audit）が埋まっている
- [ ] 未対応 AC がゼロ

## タスク100%実行確認【必須】

- [ ] サブタスク 3 件すべて completed
- [ ] AC-1〜AC-8 で空セルなし
- [ ] AC-7（stableKey 直書き禁止）に lint rule が紐付いている
- [ ] AC-6（同種 job 排他）に 409 + ledger が紐付いている

## 次 Phase

- 次: 8（DRY 化）
- 引き継ぎ事項: 命名 / 型 / endpoint の整理対象
- ブロック条件: 未対応 AC > 0

## AC matrix

| AC | 内容 | verify (Phase 4) | impl 関数 (Phase 5) | failure case (Phase 6) | audit / ledger |
| --- | --- | --- | --- | --- | --- |
| AC-1 | 31 項目 / 6 セクションを保存 | flatten.spec / runSchemaSync.spec / contract schema_versions+questions | runSchemaSync + flatten + schemaVersionsRepo + schemaQuestionsRepo | FC-8 / FC-12 | sync_jobs.payload に count |
| AC-2 | unresolved を queue へ | resolveStableKey.spec + diffQueueWriter.spec / contract schema_diff_queue | resolveStableKey + diffQueueWriter.enqueue | FC-11 / FC-15 | schema_diff_queue insert log |
| AC-3 | alias 解決後 stableKey 更新 | resolveStableKey.spec / 07b と契約 | schemaQuestionsRepo.upsert（stableKey 更新） | - | aliases の更新ログ（07b） |
| AC-4 | 同 revisionId 再実行 no-op | runSchemaSync.spec / contract count 不変 | schemaVersionsRepo.upsert ON CONFLICT | FC-9 | sync_jobs payload に diffCount=0 |
| AC-5 | sync_jobs 状態遷移記録 | runSchemaSync.spec / contract sync_jobs row | syncJobs.tryAcquire / markSucceeded / markFailed | FC-3〜FC-14 | sync_jobs ledger 自体 |
| AC-6 | 同種 job 排他 = 409 | authz + integration | tryAcquire の lock | FC-6 | sync_jobs running 行 |
| AC-7 | stableKey 直書き禁止 | lint rule + grep | resolveStableKey 経由 | FC-10 | lint CI |
| AC-8 | 31 項目欠落なし | runSchemaSync.spec count assertion | runSchemaSync の assertion | FC-12 | sync_jobs.payload に itemCount |

## 未対応 AC

- 0 件（全 AC が verify / impl / failure / audit に対応済み）
