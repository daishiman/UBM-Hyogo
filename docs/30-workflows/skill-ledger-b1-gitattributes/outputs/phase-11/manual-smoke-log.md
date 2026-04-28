# Phase 11 Manual Smoke Log

## NON_VISUAL 理由

`.gitattributes` の attribute 設計は UI を変更しない。したがって screenshot は不要であり、証跡はコマンドログで代替する。

## 実行タイミング

本 design workflow では実 `.gitattributes` を編集しない。以下は派生実装タスクで B-1 セクションを追記した後に実行する。

## Evidence State

| 項目 | 値 |
| --- | --- |
| evidenceState | placeholder |
| runId | 未採取 |
| branch | 未採取 |
| evidencePath | `outputs/phase-11/evidence/<run-id>/b1/` |
| mergeExitCodes | 未採取 |
| unmergedCount | 未採取 |
| grepCounts | 未採取 |

## コマンド

```bash
git check-attr merge -- .claude/skills/aiworkflow-requirements/LOGS/_legacy.md
git check-attr merge -- .claude/skills/aiworkflow-requirements/SKILL.md
git check-attr merge -- .claude/skills/aiworkflow-requirements/indexes/keywords.json
git check-attr merge -- pnpm-lock.yaml
git ls-files --unmerged | wc -l
```

## 期待値

| 対象 | 期待 |
| --- | --- |
| `_legacy.md` 系 | `merge: union` |
| `SKILL.md` / JSON / YAML / lockfile / code | `merge: unspecified` |
| unmerged files | `0` |

## 4 worktree smoke

Phase 2 のコマンド系列を実行し、各 worktree の追記行が 1 件ずつ保存され、unmerged file が 0 件であることを記録する。

## 実測ログ記入欄

| Check | Command | Expected | Actual | Result |
| --- | --- | --- | --- | --- |
| S-1 attribute allow | `git check-attr merge -- <_legacy.md>` | `merge: union` | 未採取 | not_run |
| S-2 attribute deny | `git check-attr merge -- <excluded>` | `merge: unspecified` | 未採取 | not_run |
| S-3 merge smoke | `git ls-files --unmerged` | 0 行 | 未採取 | not_run |
