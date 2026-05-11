# Phase 12 — Main (Issue #587 CF audit ML model artifact rotation)

## 状態

| 項目 | 値 |
| --- | --- |
| workflow_state | implemented_local_runtime_pending |
| visualEvidence | NON_VISUAL |
| 親 Issue | #549（completed） |
| 本 Issue | #587（CLOSED 維持。open/close 操作なし） |

## strict 7 ファイル一覧

| # | ファイル | 役割 |
| --- | --- | --- |
| 1 | `main.md`（本ファイル） | Phase 12 index |
| 2 | `implementation-guide.md` | Part 1 中学生レベル + Part 2 技術者レベル |
| 3 | `system-spec-update-summary.md` | SSOT 同期計画 |
| 4 | `documentation-changelog.md` | 更新ファイル一覧 |
| 5 | `unassigned-task-detection.md` | 未タスク 4 件起票案 |
| 6 | `skill-feedback-report.md` | テンプレ / ワークフロー / ドキュメント改善 |
| 7 | `phase12-task-spec-compliance-check.md` | 4 条件 compliance |

## 実行サマリ

本サイクルは implemented_local_runtime_pending close-out。rotation scripts / canary workflow / local fixture canary evidence は同一 wave で実装・取得済み。production artifact promotion は Gate-R0〜R3 + user approval 後の runtime operation に残す。runbook contract、SSOT 3 ファイル（observability-monitoring / deployment-secrets-management / 15-infrastructure-runbook）、aiworkflow indexes / LOGS、未タスク 4 件、root/outputs artifacts parity は same-wave で実体反映済み。

## next-action

1. Phase 13 G1〜G4 ユーザー承認取得
2. ユーザー承認後にのみ commit / push / PR open（branch `feat/issue-587-cf-audit-ml-artifact-rotation`、base `dev`、`Refs #549, #587`）
3. PR merge 後、本 root を `docs/30-workflows/completed-tasks/issue-587-cf-audit-ml-artifact-rotation/` に移動 + legacy stub 注記併記

## 参照

- `../../index.md`
- `../../phase-12.md`
- 親タスク Phase 12: `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/outputs/phase-12/main.md`
