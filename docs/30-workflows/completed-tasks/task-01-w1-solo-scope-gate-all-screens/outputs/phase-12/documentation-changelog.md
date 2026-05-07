# Documentation Changelog

## 変更内容

| ファイル | 種別 | 内容 |
| --- | --- | --- |
| `CLAUDE.md` | edit | UI prototype alignment / MVP recovery の scope gate を追記 |
| `docs/00-getting-started-manual/specs/00-overview.md` | edit | 19 routes と API mapping 導線を追記 |
| `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` | new | 19 routes / API mapping / 不変条件 / 後続導線を作成 |
| `docs/30-workflows/task-01-w1-solo-scope-gate-all-screens/` | new | skill 準拠 workflow package を補完 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | edit | scope gate 逆引きを追加 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | edit | UI prototype alignment task 種別から SCOPE.md / workflow package へ到達可能化 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | edit | task-01 scope gate を active guide に登録 |
| `.claude/skills/aiworkflow-requirements/SKILL.md` / `changelog/20260507-ui-prototype-scope-gate.md` | edit/new | 変更履歴と同期ログを追加 |

## 目的

Phase 12 Task 12-3 として、docs 更新履歴を残す。

## 実行タスク

- 変更ファイルを分類した。
- 正本 docs、workflow package、aiworkflow-requirements 逆引き同期、completed-tasks archive を分けて記録した。

## 参照資料

| 参照資料 | パス | 説明 |
| --- | --- | --- |
| git diff | repository worktree | 変更確認 |
| scope SSOT | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` | 新規正本 |

## 成果物

| 成果物 | パス |
| --- | --- |
| documentation changelog | `outputs/phase-12/documentation-changelog.md` |

## 完了条件

- [x] 変更ファイルと変更内容が記録されている。
- [x] lint / diff scope の実測更新が Phase 11 evidence と整合している。
