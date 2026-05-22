# Implementation Guide

## Part 1: 中学生向け説明

### なぜ必要か

学校の係活動で「準備中」「先生に確認中」「発表できる」の札が人によって違うと、同じ作業を見ても「終わった」「まだ」と食い違う。このタスクでは、その札の名前と貼り替えるタイミングを一つの辞書にまとめた。

### 何をしたか

- `workflow-state-vocabulary.md`: 作業の進み具合を表す言葉の辞書
- `phase12-compliance-check-template.md`: その言葉どおりに記録できているか見るチェック表
- 既存の Phase 11 / Phase 12 の説明から新しい辞書へリンク

### 用語の言い換え

| 用語 | 日常語の言い換え |
| --- | --- |
| workflow_state | 作業全体の今の札 |
| Phase | 作業を区切った段階 |
| evidence | 本当にやったことを示す記録 |
| compliance check | 約束どおりか見る確認表 |
| index | 探しやすくする目次 |

## Part 2: 技術者向け説明

### Added references

- `.claude/skills/task-specification-creator/references/workflow-state-vocabulary.md`
- `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md`

### State contract

```ts
type WorkflowState =
  | "spec_created"
  | "CONTRACT_READY_IMPLEMENTATION_PENDING"
  | "implemented_local_evidence_captured"
  | "PASS_BOUNDARY_SYNCED_RUNTIME_PENDING"
  | "verified_current_no_code_change_pending_pr"
  | "completed";
```

### Edge cases

- Runtime evidence pending: use `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`, not bare `PASS`.
- Skill-only implementation: use `implemented_local_evidence_captured` after reference/SKILL/changelog/LOGS changes and Phase 11 evidence exist.
- Deleted or moved workflow root: run stale-reference checks and update aiworkflow ledgers in the same wave.

### Phase 11 evidence references

The NON_VISUAL evidence for this task is stored under
`docs/30-workflows/issue-534-skill-workflow-state-guidance/outputs/phase-11/evidence/`:

- `typecheck.log`
- `lint.log`
- `indexes-rebuild.log`
- `indexes-diff.log`
- `grep-vocabulary.log`
- `link-reachability.log`
- `changelog-sync.log`
- `logs-sync.log`
- `compliance-check-structure.log`
- `changelog-deletions.log`
- `logs-deletions.log`
- `skillmd-deletions.log`
