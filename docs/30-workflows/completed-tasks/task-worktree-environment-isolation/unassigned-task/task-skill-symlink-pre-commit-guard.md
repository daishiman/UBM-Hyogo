# task-skill-symlink-pre-commit-guard

| 項目 | 内容 |
| --- | --- |
| status | detected |
| detected_in | task-worktree-environment-isolation |
| priority | medium |
| owner_candidate | task-git-hooks-lefthook-and-post-merge |

## Why

`.claude/skills` 配下に symlink が残ると、worktree ごとの skill 境界が崩れ、別 worktree の変更が暗黙に反映される。

## What

- lefthook pre-commit に `find .claude/skills -maxdepth 3 -type l` の検出を追加する。
- CI でも同等チェックを実行する。
- 既存 worktree の遡及確認コマンドを docs 化する。

## Acceptance Criteria

- skill symlink が存在する状態で commit が失敗する。
- CI で同等の検出が失敗する。
- symlink inventory の出力と rollback 手順が残る。

## References

- `docs/30-workflows/task-worktree-environment-isolation/outputs/phase-8/before-after.md`
- `.claude/skills/aiworkflow-requirements/references/lessons-learned-health-policy-worktree-2026-04.md`
