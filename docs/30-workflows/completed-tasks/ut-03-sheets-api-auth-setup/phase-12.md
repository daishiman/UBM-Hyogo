# Phase 12: ドキュメント更新（5 タスク + compliance 必須）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 12 / 13 |
| 前 Phase | 11 (手動 smoke) |
| 次 Phase | 13 (PR 作成) |
| 状態 | completed（仕様書 close-out 完了。workflow root は `completed`） |

## 5 必須タスク

| # | タスク | 出力 |
| --- | --- | --- |
| 12-0 | Phase 12 本体サマリ | outputs/phase-12/main.md |
| 12-1 | 実装ガイド作成（Part 1 中学生レベル + Part 2 技術者レベル）| outputs/phase-12/implementation-guide.md |
| 12-2 | システム仕様書更新サマリ | outputs/phase-12/system-spec-update-summary.md |
| 12-3 | ドキュメント更新履歴 | outputs/phase-12/documentation-changelog.md |
| 12-4 | 未タスク検出レポート（**0 件でも出力必須**）| outputs/phase-12/unassigned-task-detection.md |
| 12-5 | スキルフィードバックレポート（**改善点なしでも出力必須**）| outputs/phase-12/skill-feedback-report.md |
| 12-6 | Phase 12 task-spec compliance check | outputs/phase-12/phase12-task-spec-compliance-check.md |

## 完了条件

- [x] 7 ファイル（main.md + 5 タスク成果物 + compliance check）が存在する
- [x] 実装ガイド Part 1 が中学生レベル（鍵束のたとえ等）
- [x] system-spec-update-summary が aiworkflow-requirements の same-wave 同期範囲と実装後反映範囲を分離
- [x] workflow root の `metadata.workflow_state` を `completed` に更新（Sheets auth 実装込み）
