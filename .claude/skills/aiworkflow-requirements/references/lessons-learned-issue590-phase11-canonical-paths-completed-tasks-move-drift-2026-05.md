# Lessons Learned: Issue #590 Phase 11 canonical paths — completed-tasks/ 移動後の path drift

| 項目 | 値 |
| --- | --- |
| 日付 | 2026-05-10 |
| Issue | #590 |
| workflow | `docs/30-workflows/completed-tasks/issue-590-phase11-canonical-evidence-paths/` |
| 種別 | path canonicalization / supersede chain |

## 苦戦箇所

`task-specification-creator` skill の `completed-tasks 移動` 規約に従い workflow ディレクトリが
`docs/30-workflows/issue-590-...` から `docs/30-workflows/completed-tasks/issue-590-...` へ移動された際、
**移動先内部の cross-reference が旧パスのまま**残り、`canonical-paths.json` の `workflowDir` と
`pnpm validate:phase11-paths --check-existence` が破綻した。

具体的に同期が必要な箇所:

1. `outputs/phase-11/canonical-paths.json` の `workflowDir` フィールドおよび `evidence[].command` 内の path
2. `phase-{01,05,09,10,11,12}.md`、`index.md` のコマンド例 / 引用パス
3. `outputs/phase-11/main.md`、`outputs/phase-12/unassigned-task-detection.md`、`outputs/phase-12/phase12-task-spec-compliance-check.md`
4. `aiworkflow-requirements` の `changelog/`、`references/task-workflow-active.md`、`references/workflow-...-artifact-inventory.md`、`indexes/quick-reference.md`、`indexes/resource-map.md`
5. supersede 元 `unassigned-task/u-fix-...` も `completed-tasks/` 配下へ移動し、header に `superseded by` および新 parent path を追記

## 同様の課題を将来簡潔に解決するための知見

- **一括書き換えコマンド**: 旧パスが新パスの substring であるため、negative lookbehind で安全に置換する。
  ```bash
  perl -i -pe 's|(?<!completed-tasks/)docs/30-workflows/<task-dir>|docs/30-workflows/completed-tasks/<task-dir>|g'
  ```
- **evidence log は再生成**: historical な実行ログでも canonical state と整合させるため、validator を新パスで再実行し log を上書きする。
- **followup supersede header**: `superseded by` と `親` の双方を新パス（`completed-tasks/` 配下）に揃える。
- **CI gate 候補**: `verify-phase11-canonical-paths` を将来導入する場合、`workflowDir` と manifest の実体配置の一致を gate 条件に含めること。

## 関連リンク

- workflow: `docs/30-workflows/completed-tasks/issue-590-phase11-canonical-evidence-paths/`
- schema: `.claude/skills/task-specification-creator/schemas/phase11-evidence-canonical-paths.schema.json`
- validator: `.claude/skills/task-specification-creator/scripts/validate-phase11-canonical-evidence-paths.js`
- supersede: `docs/30-workflows/completed-tasks/u-fix-cf-acct-01-deriv-04-fu-03-d-followup-05.md`
