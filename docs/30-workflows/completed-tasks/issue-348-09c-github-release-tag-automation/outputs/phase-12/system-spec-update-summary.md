# System Spec Update Summary

## Updated Canonical Specs

| File | Update |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/release-runbook.md` | Added GitHub Release creation SSOT and user-gated mutation boundary |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | Registered issue-348 workflow |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | Added issue-348 reverse index |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | Added immediate release automation reference |
| `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | Added same-wave sync log |

## Same-wave Sync Steps

| Step | Action | Evidence |
| --- | --- | --- |
| 1-A | `references/release-runbook.md` を新規作成し SSOT 化 | git status `??` 検出 |
| 1-B | `references/workflow-issue-348-09c-github-release-tag-automation-artifact-inventory.md` を artifact inventory として新規作成 | git status `??` 検出 |
| 1-C | `references/task-workflow-active.md` に issue-348 を Active として登録 | `git diff` 該当ブロック |
| 2 | indexes (`resource-map.md` / `quick-reference.md` / `topic-map.md` / `keywords.json`) を `pnpm indexes:rebuild` 経由で同期 | `indexes-rebuild.log`（本フォルダ同梱） |
| 3 | `LOGS/_legacy.md` に同 wave ログ追記 | `git diff` 該当ブロック |
| 4 | `SKILL.md` changelog 1 行追加 | `git diff` 該当ブロック |

Step 2 N/A 判定はなし（全 indexes ファイル同 wave 同期対象）。

## Index Rebuild

Command:

```bash
pnpm indexes:rebuild
```

Evidence: `indexes-rebuild.log`（本フォルダ）に 509 ファイル分類・3953 キーワード生成の出力を記録済み。
