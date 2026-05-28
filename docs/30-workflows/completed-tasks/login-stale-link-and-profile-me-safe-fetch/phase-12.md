# Phase 12: ドキュメント更新

## 必須 6 成果物

| Task | ファイル | 内容 |
|------|---------|------|
| 1 | `outputs/phase-12/implementation-guide.md` | Part 1（中学生向け）+ Part 2（技術詳細） |
| 2 | `outputs/phase-12/system-spec-update-summary.md` | docs/00-getting-started-manual/specs/ 更新 summary（新規 IF なしのため Step 1 のみ） |
| 3 | `outputs/phase-12/documentation-changelog.md` | docs 変更履歴 |
| 4 | `outputs/phase-12/unassigned-task-detection.md` | 0 件でも必須 |
| 5 | `outputs/phase-12/skill-feedback-report.md` | 改善点なしでも必須 |
| 6 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | canonical 9 headings |

## 未タスク検出

| ソース | 確認結果 |
|-------|---------|
| 元仕様書スコープ外 | なし（CONST_007 で本サイクル完了） |
| Phase 3 MINOR | apps/api 側の grep 検査（範囲外として記録、0 件確認のみ） |
| Phase 11 手動テスト | staging runtime 検証は user-gated（task ではない） |
| TODO/FIXME grep | Phase 12 実行時に再 grep |
| `describe.skip` | 同上 |

## スキル同期 same-wave

- aiworkflow-requirements: `task-workflow-active.md` / `artifact-inventory.md` / lessons-learned / `LOGS.md` / `SKILL-changelog.md` を Phase 12 close-out で更新
- task-specification-creator: `LOGS.md` / 必要なら `references/patterns-lessons.md`

## 既存workflow との関係

直前完了 `profile-server-components-render-error` の残課題（bare `/me` fetch）を本タスクで吸収。memory 上の対象 workflow 行に「`/me` followup は本ワークフローで吸収済」を追記。
