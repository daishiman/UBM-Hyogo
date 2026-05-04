# Documentation Changelog

## Changed

- Added UT-07B-FU-03 D1 production migration apply runbook reverse index to `resource-map.md`.
- Added `bash scripts/cf.sh d1:apply-prod` quick reference.
- Added aiworkflow-requirements SKILL changelog and changelog fragment.
- Added workflow and skill logs.
- Added Phase 11/12 NON_VISUAL evidence outputs for UT-07B-FU-05.

## Updated (06b-C path realignment / 同wave 同期)

- Realigned 06b-C `profile-logged-in-visual-evidence` 正本パスを `docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/` に揃え、以下を同 wave で同期:
  - `.claude/skills/aiworkflow-requirements/changelog/20260503-06b-C-profile-logged-in-visual-evidence.md`
  - `.claude/skills/aiworkflow-requirements/references/lessons-learned-06b-profile-logged-in-visual-evidence-2026-04.md`
  - `.claude/skills/aiworkflow-requirements/references/workflow-06b-c-profile-logged-in-visual-evidence-artifact-inventory.md`
  - `.claude/skills/aiworkflow-requirements/references/legacy-ordinal-family-register.md`
  - `docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/{artifacts.json, outputs/phase-12/{documentation-changelog.md, implementation-guide.md}, phase-02.md, phase-04.md, phase-05.md, phase-11.md, phase-13.md}`
  - `docs/30-workflows/unassigned-task/task-06b-c-profile-logged-in-runtime-evidence-execution-001.md`
- 理由: `completed-tasks/` への正本パス移動に伴う inventory / changelog / lessons-learned / legacy-ordinal-family-register / phase 成果物 / unassigned-task stub の path 整合。別タスクではなく FU-05 reverse-index 追加と同一 skill metadata 整合 wave として扱う。

## Validation commands

```bash
rg "d1-migration-verify|scripts/d1|d1:apply-prod" .claude/skills/aiworkflow-requirements/indexes
mise exec -- pnpm indexes:rebuild
mise exec -- pnpm typecheck
mise exec -- pnpm lint
git diff --stat
```

## Validation result

| Command | Result |
| --- | --- |
| `rg "d1-migration-verify\|scripts/d1\|d1:apply-prod" .claude/skills/aiworkflow-requirements/indexes` | PASS |
| `mise exec -- pnpm indexes:rebuild` | PASS (exit 0, twice) |
| `mise exec -- pnpm typecheck` | PASS (exit 0) |
| `mise exec -- pnpm lint` | PASS (exit 0; stablekey warning-mode reported existing 2 warnings) |
