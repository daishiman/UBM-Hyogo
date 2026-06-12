# Documentation Changelog

## Workflow-local 同期（本ワークフロー配下）

| Step | 対象 | 内容 | 状態 |
| --- | --- | --- | --- |
| Step 1-A | `outputs/phase-11/phase-11.md` | local deterministic evidence present / staging screenshot pending へ更新 | 更新済 |
| Step 1-B | `outputs/phase-12/*`（strict 7） | 集約 entry / implementation-guide / spec-update / changelog / unassigned / feedback / compliance を実装済み状態へ同期 | 更新済 |
| Step 1-C | `outputs/phase-13/phase-13.md` | PR 作成仕様（user 承認後 / pending） | 作成済 |
| Step 2 | `artifacts.json` / `outputs/artifacts.json` | `implemented_local_runtime_pending` へ再分類、Gate-B passed に更新 | 更新済 |

## Global skill sync（Feedback BEFORE-QUIT-003 に従い別ブロック）

| 対象 | 内容 | 状態 |
| --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/**` | workflow ledger / artifact inventory / changelog / indexes を同期 | 更新済 |
| `.claude/skills/task-specification-creator/**` | テンプレート / reference 改善なし（skill-feedback-report 参照） | 該当なし |
| `docs/00-getting-started-manual/specs/**` | 表現層 className のみ・正本契約不変ゆえ更新なし | 該当なし |
| indexes（topic-map / keywords） | artifact inventory 追加後に `pnpm indexes:rebuild` | 実行対象 |

> Step1（workflow-local）と Step2（global skill sync）を別ブロックで記録（BEFORE-QUIT-003）。
> いずれも「該当なし」は明示記載し、無記載で握り潰さない。
