# Phase 12: ドキュメント更新

## 必須成果物（7 件）

`docs/30-workflows/ut-08a-04-d1-migration-test-guideline/outputs/phase-12/` 配下に作成:

| # | ファイル | 内容 |
| - | -------- | ---- |
| 1 | `implementation-guide.md` | 実装サマリ + 中学生レベル概念説明（migration とは / なぜ test 最低基準が必要か / CI comment の仕組み） |
| 2 | `system-spec-update-summary.md` | aiworkflow-requirements への影響（新 runbook の reverse index 追記の要否判断） |
| 3 | `documentation-changelog.md` | 追加 / 編集された文書ファイル一覧（runbook / README / yml / bats） |
| 4 | `unassigned-task-detection.md` | 本タスクで派生する未割当タスクの検出（無ければ "なし"） |
| 5 | `skill-feedback-report.md` | task-specification-creator skill 利用上の改善点（無ければ "なし"） |
| 6 | `phase12-task-spec-compliance-check.md` | Phase 12 必須セクション充足チェック |
| 7 | `main.md` | Phase 12 統合サマリ（他 6 件の index） |

## phase12-task-spec-compliance-check.md canonical headings

`phase12-task-spec-compliance-check.md` は task-specification-creator の canonical SSOT に合わせ、次の 9 見出しを逐語で含める:

1. Summary verdict
2. Changed-files classification
3. `workflow_state` and phase status consistency
4. Phase 11 evidence file inventory
5. Phase 12 strict 7 file inventory
6. Skill/reference/system spec same-wave sync
7. Runtime or user-gated boundary
8. Archive/delete stale-reference gate
9. Four-condition verdict

## implementation-guide.md（中学生レベル説明セクション）

> **migration ってなに？**
> アプリが使うデータベース（情報を保存する場所）のかたちを変える「指示書」のこと。新しい列を足したり、ルールを増やしたりする命令が書かれている。
>
> **どうして test が必要？**
> 指示書を実行したあと、データベースが期待通りになっているか・他の処理が壊れていないかを自動で確かめないと、本番でこわれる。
>
> **最低基準 3 つの意味**
> 1. 指示書が動くこと（forward apply green）
> 2. 既存のテストが全部 OK のままであること（contract test pass）
> 3. 変更点を確かめるテストを 1 つ以上追加すること（新規 test）

## CHANGELOG / system-spec 更新方針

- `aiworkflow-requirements` の `references/task-workflow-active.md` に `ut-08a-04-d1-migration-test-guideline` を `implemented_local_runtime_pending / implementation / NON_VISUAL` として追記
- `aiworkflow-requirements` の `references/workflow-ut-08a-04-d1-migration-test-guideline-artifact-inventory.md` を新規作成
- `quick-reference.md` / `resource-map.md` / `topic-map.md` / `keywords.json` は `pnpm indexes:rebuild` で必要な generated sync を行う
- 影響範囲が文書 + CI のみであり、API endpoint / DB schema の正本仕様には影響しないため、`api-endpoints.md` / `database-schema.md` の更新は不要

## DoD

- 7 成果物が揃う
- `phase12-task-spec-compliance-check.md` が canonical 9 見出しをすべて含む
- root `artifacts.json` と `outputs/artifacts.json` が一致する

## メタ情報

| 項目 | 内容 |
| --- | --- |
| task | ut-08a-04-d1-migration-test-guideline |
| phase | 12 |
| status | completed |

## 目的

Phase 12 strict outputs と aiworkflow-requirements 同期を完了する。

## 実行タスク

- strict 7 files を作成する。
- root/output artifacts parity と canonical 9 heading を検証する。
- aiworkflow artifact inventory と active workflow row を同期する。

## 参照資料

- `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 成果物/実行手順

`outputs/phase-12/` の7ファイルと aiworkflow 同期ファイルを作成する。

## 完了条件

- Phase 12 strict 7 files が存在する。
- root / outputs `artifacts.json` が一致する。
- `phase12-task-spec-compliance-check.md` が canonical 9 heading を含む。
