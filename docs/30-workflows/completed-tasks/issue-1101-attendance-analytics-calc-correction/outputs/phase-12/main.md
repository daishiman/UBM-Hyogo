# Phase 12: ドキュメント同期（issue-1101-attendance-analytics-calc-correction）

Phase 12 は本タスク（出席分析の計算意味論是正）の実装ガイド・システム仕様同期・更新履歴・未タスク検出・skill feedback・準拠チェックを
root evidence として固定するフェーズである。workflow_state は `implemented_local_evidence_captured`（commit/PR/staging visual は user-gated）。

## 概要

| 項目 | 内容 |
| --- | --- |
| タスクID | `issue-1101-attendance-analytics-calc-correction` |
| 実装区分 | [実装区分: 実装仕様書] |
| workflow_state | `implemented_local_evidence_captured`（実コード・focused tests・正本仕様同期まで完了） |
| visualEvidence | `VISUAL`（主証跡=focused vitest。staging 視覚証跡は user-gated） |
| source | GitHub issue #1101（CLOSED のまま維持） |
| Step 2 判定 | **該当**（新規 field `uniqueAttendeeCount` / `uniqueAttendanceRate` + `AttendanceZone` enum 再設計で 01-api-schema.md 更新要） |

## 6 成果物索引

| 成果物 | パス | 役割 |
| --- | --- | --- |
| Task 1 実装ガイド | [implementation-guide.md](implementation-guide.md) | Part 1（中学生レベル例え話）/ Part 2（型・SQL・bind 順序・定数・エラーハンドリング・視覚証跡） |
| Task 2 システム仕様更新サマリ | [system-spec-update-summary.md](system-spec-update-summary.md) | Step 1-A/1-B/1-C/Step 2 の判定。Step 2 = 該当（01-api-schema.md 更新要） |
| Task 3 更新履歴 | [documentation-changelog.md](documentation-changelog.md) | 全 Step の結果（該当なしも記録）。workflow-local 同期と global skill sync を分離 |
| Task 4 未タスク検出 | [unassigned-task-detection.md](unassigned-task-detection.md) | current = 0。M-1/M-2 は本サイクル内で解消または設計判断完了 |
| Task 5 skill feedback | [skill-feedback-report.md](skill-feedback-report.md) | テンプレート / ワークフロー / ドキュメント改善の 3 観点 |
| Task 6 準拠チェック | [phase12-task-spec-compliance-check.md](phase12-task-spec-compliance-check.md) | canonical 9 見出し + Phase 11 evidence inventory + four-condition verdict |

## Phase 11 証跡索引

| 成果物 | パス | 状態 |
| --- | --- | --- |
| 手動テスト結果 | [../phase-11/manual-test-result.md](../phase-11/manual-test-result.md) | present（focused Vitest 実行済み。staging 視覚証跡のみ user-gated） |

## 状態境界

- 実コード差分・focused vitest は **本サイクルで取得済み**。
- commit / push / PR / staging deploy / staging screenshot は **user-gated**。
- issue #1101 は CLOSED のまま（状態変更なし）。
