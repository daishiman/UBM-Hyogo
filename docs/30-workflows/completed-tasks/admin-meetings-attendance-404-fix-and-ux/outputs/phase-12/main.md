**[実装区分: 実装仕様書 / 状態: implemented_local_runtime_pending]**

# Phase 12: main

`[実装区分: 実装仕様書]` / `workflow_state: implemented_local_runtime_pending` / `taskType: implementation` / `visualEvidence: VISUAL_ON_EXECUTION`

本ワークフローは admin `/admin/meetings` の開催日追加 404 修正と出席管理 UI/UX 改善を apps/web に実装し、focused Vitest でローカル検証した。commit / PR / staging deploy / screenshot は user-gated。

## 実施・証跡結果

| 項目 | 結果 |
| --- | --- |
| 実装 | completed_local。proxy transport 統一 + 出席 UI 改善 + focused tests |
| focused Vitest | PASS: 4 files / 15 tests |
| web typecheck | PASS |
| web lint | PASS |
| Phase 12 compliance | PASS |
| staging 実測 | pending（user-gated） |
| screenshots | pending（user-gated staging） |

## strict 7 outputs

| # | ファイル | 役割 |
| --- | --- | --- |
| 1 | `main.md` | Phase 12 正本サマリ |
| 2 | `implementation-guide.md` | 実装ガイド + 視覚証跡 boundary |
| 3 | `system-spec-update-summary.md` | システム仕様更新判定 |
| 4 | `documentation-changelog.md` | ドキュメント更新履歴 |
| 5 | `unassigned-task-detection.md` | 未タスク検出 |
| 6 | `skill-feedback-report.md` | skill フィードバック |
| 7 | `phase12-task-spec-compliance-check.md` | canonical 9 headings + 4条件検証 |

`phase-12.md` は既存参照互換の mirror summary として残す。
