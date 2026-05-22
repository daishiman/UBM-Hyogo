# Documentation Changelog

## サマリ

| Date | Change |
| --- | --- |
| 2026-05-07 | Created and validated task-19 workflow, 09c-primitives.md, Phase 11 evidence, Phase 12 strict outputs, and aiworkflow discoverability entries. |
| 2026-05-07 | Review correction: removed placeholder token expressions, restored §99 exclusion table, added deterministic `scripts/verify-09c-no-visual-values.sh`, refreshed Phase 11 evidence, and documented adjacent `apps/api` code diff separation. |
| 2026-05-07 | Added `elegant-review-correction.md` with compact 30-thinking-method evidence and final 4-condition verification. |

## 変更ファイル（canonical absolute path）

### Skill canonical files

- `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260507-162603-wt-15/.claude/skills/aiworkflow-requirements/SKILL.md` — task-19 trigger / discoverability 文言を追記
- `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260507-162603-wt-15/.claude/skills/task-specification-creator/SKILL.md` — Phase 12 documentation guide 強化に合わせて記述更新
- `LOGS.md`: 該当 skill に LOGS.md は存在しないため対象外（changelog ファイル `.claude/skills/task-specification-creator/SKILL-changelog.md` および `.claude/skills/aiworkflow-requirements/changelog/20260507-task19-primitives-full-spec.md` が代替）

### references/*.md

- `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260507-162603-wt-15/.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` — task-19 entry 追記
- `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260507-162603-wt-15/.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` — task-19 / 09c discoverability 追記
- `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260507-162603-wt-15/.claude/skills/aiworkflow-requirements/indexes/resource-map.md` — 09c primitives spec エントリ追加
- `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260507-162603-wt-15/.claude/skills/aiworkflow-requirements/indexes/topic-map.md` — primitives topic 追記
- `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260507-162603-wt-15/.claude/skills/task-specification-creator/references/phase-12-documentation-guide.md` — 個別変更は本タスクでは「変更なし」（並列 stream 担当）

### Workflow artifacts

- `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260507-162603-wt-15/docs/30-workflows/completed-tasks/task-19-w2-primitives-full-spec/index.md`
- `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260507-162603-wt-15/docs/30-workflows/completed-tasks/task-19-w2-primitives-full-spec/artifacts.json`
- `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260507-162603-wt-15/docs/30-workflows/completed-tasks/task-19-w2-primitives-full-spec/phase-{01..13}.md`
- `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260507-162603-wt-15/docs/30-workflows/completed-tasks/task-19-w2-primitives-full-spec/outputs/phase-{01..13}/*.md`

### artifacts.json parity

- root `artifacts.json` のみ存在（full mirror なし）
- `outputs/artifacts.json` は **未生成 / 未採用**（lightweight marker 方式は本タスクでは適用していない）
- 区別: 本タスクは root `artifacts.json` を正本とし、outputs 側にミラーは置かない設計

### Spec individual paths

- `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260507-162603-wt-15/docs/00-getting-started-manual/specs/09c-primitives.md` — 1172 行、17 JSX excerpts、21 numbered headings、§99 復元
- `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260507-162603-wt-15/scripts/verify-09c-no-visual-values.sh` — 新規 deterministic validator

### Validator 実行コマンドと exit code（2026-05-07 実測）

```
$ bash scripts/verify-09c-no-visual-values.sh
HEX: 0
oklch: 0
px: 0
bgBracket: 0
placeholder-token-sized: 0
placeholder-09b-token-value: 0
placeholder-token-mix: 0
numbered_headings: 21
section99: 1
jsx_blocks: 17
OK
$ echo $?
0
```
