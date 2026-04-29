# Phase 12 Task Spec Compliance Check

template (`docs/02-application-implementation/_templates/phase-meaning-app.md` 相当) への準拠 chk。

| 項目 | 期待 | 実績 | 状態 |
|---|---|---|---|
| 必須セクション 11 種 (メタ情報 / 目的 / 実行タスク / 参照資料 / 実行手順 / 統合テスト連携 / 多角的チェック観点 / サブタスク管理 / 成果物 / 完了条件 / タスク100%実行確認 / 次 Phase) | 全 phase に含む | OK (Phase 1〜13 すべて) | PASS |
| Phase 別追加項目 (Phase 11 manual evidence など) | template 通り | `outputs/phase-11/manual-smoke-log.md` / `link-checklist.md` / txt evidence を確認 | PASS |
| 不変条件番号引用 | 多角的チェック観点に番号付き | OK (#2/#3/#5/#7/#9/#10) | PASS |
| outputs path | `outputs/phase-XX/main.md` 必須 | OK (全 phase) | PASS |
| user_approval_required | Phase 13 のみ true | OK (artifacts.json で確認) | PASS |
| artifacts parity | root `artifacts.json` と `outputs/artifacts.json` が一致 | OK (Phase 12 再検証で同期) | PASS |
| AC trace | AC × test × runbook × failure 紐付け | OK (`outputs/phase-07/ac-matrix.md`) | PASS |
| failure 連番 | F-XX | OK (F-01〜F-17, `outputs/phase-06/main.md`) | PASS |
| taskType / visualEvidence metadata | implementation + NON_VISUAL | `metadata.taskType=implementation`, `metadata.docs_only=false`, `metadata.visualEvidence=NON_VISUAL` | PASS |
| 正本仕様 same-wave sync | API / env / lessons / indexes / task-workflow を同期 | `aiworkflow-requirements` の references / indexes と `.agents` mirror を同期 | PASS |
| 7 種ドキュメント (Phase 12) | main + 6 種 | OK (main, implementation-guide, system-spec-update-summary, documentation-changelog, unassigned-task-detection, skill-feedback-report, phase12-task-spec-compliance-check) | PASS |

## 結論

template 準拠。Phase 12 再検証で検出した artifacts parity、Phase 11 補助 evidence、正本仕様 same-wave sync の漏れは是正済み。
