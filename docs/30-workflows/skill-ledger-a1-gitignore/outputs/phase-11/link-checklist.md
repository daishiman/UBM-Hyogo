# Phase 11: リンク健全性チェックリスト

## 概要

仕様書間（index.md / phase-NN.md / outputs / 上流 runbook）の参照リンクが死んでいないかを spec walkthrough で確認する。

| 凡例 | 意味 |
| --- | --- |
| OK | 参照先が存在し、内容が合致 |
| Broken | 参照先が存在しない / リンク文字列が壊れている |
| Pending | 後続 Phase（4〜10）作成時に再確認 |

## ワークフロー内リンク

| 参照元 | 参照先 | 状態 |
| --- | --- | --- |
| `index.md` | `phase-01.md` | OK |
| `index.md` | `phase-02.md` | OK |
| `index.md` | `phase-03.md` | OK |
| `index.md` | `phase-11.md` | OK |
| `index.md` | `phase-12.md` | OK |
| `index.md` | `phase-13.md` | OK |
| `index.md` | `outputs/phase-01/main.md` | OK |
| `index.md` | `outputs/phase-02/main.md` | OK |
| `index.md` | `outputs/phase-03/main.md` | OK |
| `index.md` | `artifacts.json` | OK |
| `phase-01.md` | `outputs/phase-01/main.md` | OK |
| `phase-02.md` | `outputs/phase-02/main.md` | OK |
| `phase-03.md` | `outputs/phase-03/main.md` | OK |
| `phase-11.md` | `outputs/phase-11/main.md` | OK |
| `phase-11.md` | `outputs/phase-11/manual-smoke-log.md` | OK |
| `phase-11.md` | `outputs/phase-11/link-checklist.md` | OK |
| `phase-12.md` | `outputs/phase-12/implementation-guide.md` | OK |
| `phase-12.md` | `outputs/phase-12/system-spec-update-summary.md` | OK |
| `phase-12.md` | `outputs/phase-12/documentation-changelog.md` | OK |
| `phase-12.md` | `outputs/phase-12/unassigned-task-detection.md` | OK |
| `phase-12.md` | `outputs/phase-12/skill-feedback-report.md` | OK |
| `phase-13.md` | `outputs/phase-13/main.md` | OK |
| `outputs/phase-11/main.md` | `outputs/phase-11/manual-smoke-log.md` | OK |
| `outputs/phase-11/main.md` | `outputs/phase-11/link-checklist.md` | OK |

## 上流 runbook / 派生タスクへのリンク

| 参照元 | 参照先 | 状態 |
| --- | --- | --- |
| `index.md` | `../completed-tasks/unassigned-task-skill-ledger/task-skill-ledger-a1-gitignore.md` | OK |
| `index.md` | `../completed-tasks/task-conflict-prevention-skill-state-redesign/outputs/phase-5/gitignore-runbook.md` | OK |
| `index.md` | `../completed-tasks/task-conflict-prevention-skill-state-redesign/outputs/phase-5/main.md` | OK |
| `index.md` | `../completed-tasks/task-conflict-prevention-skill-state-redesign/outputs/phase-12/implementation-guide.md` | OK |
| `index.md` | `../completed-tasks/task-conflict-prevention-skill-state-redesign/outputs/phase-12/unassigned-task-detection.md` | OK |
| `index.md` | `../completed-tasks/unassigned-task-skill-ledger/task-skill-ledger-a2-fragment.md` | OK |
| `index.md` | `../completed-tasks/unassigned-task-skill-ledger/task-skill-ledger-a3-progressive-disclosure.md` | OK |
| `index.md` | `../completed-tasks/unassigned-task-skill-ledger/task-skill-ledger-b1-gitattributes.md` | OK |
| `phase-11.md` | `.claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md` | OK |
| `phase-11.md` | `.claude/skills/task-specification-creator/references/phase-template-phase11.md` | OK |
| `phase-12.md` | `.claude/skills/task-specification-creator/references/phase-template-phase12.md` | OK |
| `phase-12.md` | `.claude/skills/task-specification-creator/references/phase-12-documentation-guide.md` | OK |

## 後続 Phase（4〜10）参照

| 参照元 | 参照先 | 状態 |
| --- | --- | --- |
| `index.md` | `phase-04.md`〜`phase-10.md` | OK（phase-04.md〜phase-10.md 作成済み） |
| `index.md` | `outputs/phase-04/`〜`outputs/phase-10/` | Pending（同上） |

## skill ledger / mirror parity

> 本タスクは `.claude` ↔ `.agents` mirror に該当ファイルを持たない（ワークフロー側のみ）。`diff -qr .claude/ .agents/` 相当の mirror parity 確認は対象外。

| 参照元 | 参照先 | 状態 |
| --- | --- | --- |
| `.claude` ↔ `.agents` mirror | 本タスクは対象外 | N/A |

## 結論

- ワークフロー内リンク: **全件 OK**
- 上流 runbook / 派生タスクへのリンク: **全件 OK**
- Phase 4〜10: 作成済み。pending は実装状態のみを示す
- mirror parity: N/A（対象外）

Broken は **0 件**。Phase 12 へ進める。
