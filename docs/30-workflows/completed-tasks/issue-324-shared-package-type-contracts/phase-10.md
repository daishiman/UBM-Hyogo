# Phase 10: ドキュメント更新

[実装区分: 実装仕様書]

## 目的

元 UT-08A-05 spec への close note 追記、`unassigned-task/` から `completed-tasks/` への移動、関連ドキュメントの cross-link を整える。

## 入力

- `docs/30-workflows/completed-tasks/UT-08A-05-shared-package-type-test.md`（元仕様書 / completed trace）
- `.claude/skills/aiworkflow-requirements/references/workflow-task-08a-parallel-api-contract-repository-and-authorization-tests-artifact-inventory.md`（発見元）
- `packages/shared/src/__tests__/type-contracts.spec.ts`（実装）

## 手順

| # | 操作 | 詳細 |
| --- | --- | --- |
| 1 | 元 spec の status 更新 | `UT-08A-05-shared-package-type-test.md` の `ステータス` 行を `未実施` → `完了 (issue-324-shared-package-type-contracts)` に更新済 |
| 2 | 元 spec に close note 追記 | 末尾に `## 完了記録` セクションを追加し、本ワークフロー path / GitHub Issue #324 / 実装ファイルパスを記録済 |
| 3 | spec 移動 | `completed-tasks/UT-08A-05-shared-package-type-test.md` へ移動済 |
| 4 | 発見元 inventory への back-link 追記 | aiworkflow-requirements の 08a artifact inventory の UT-08A-05 行を「resolved by `docs/30-workflows/issue-324-shared-package-type-contracts/`」へ更新 |
| 5 | 本ワークフロー index に link | `docs/30-workflows/issue-324-shared-package-type-contracts/index.md` の「成果物」表に上記 path を反映 |

## 変更対象ファイル

| 操作 | パス |
| --- | --- |
| edit | `docs/30-workflows/completed-tasks/UT-08A-05-shared-package-type-test.md` |
| move | source unassigned → completed trace |
| edit | `.claude/skills/aiworkflow-requirements/references/workflow-task-08a-parallel-api-contract-repository-and-authorization-tests-artifact-inventory.md` |
| edit | `docs/30-workflows/issue-324-shared-package-type-contracts/index.md`（成果物表） |

## 出力

- 上記 4 ファイルの diff を `outputs/phase-10/docs-changelog.md` に集約。

## 完了条件 (DoD)

- [ ] 元 spec が `completed-tasks/` に移動済。
- [ ] 元 spec 末尾に完了記録セクション追加。
- [ ] 発見元 detection 文書に back-link 追記。
- [ ] index.md の成果物表が更新。
- [ ] `docs/30-workflows/unassigned-task/` 配下に UT-08A-05 が残っていないことを `ls` で確認。

## リスクと対策

| リスク | 対策 |
| --- | --- |
| `git mv` がメインディレクトリで実行されワークツリーに反映されない | CLAUDE.md の「Claude Code は必ずワークツリーディレクトリから起動」ルールに従う |
| 発見元 detection の anchor がずれる | 直接行番号ではなく `§5` 見出し参照で書く |
