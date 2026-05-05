# Skill Feedback Report

state: DOC_PASS

## テンプレ改善

Destructive operation workflows need a dedicated Phase 11/13 template variant: `destructive-operation / NON_VISUAL / runtime pending`. The template should require explicit user approval evidence and prohibit `PASS` when approval is absent.

## ワークフロー改善

Deploy-deferred and destructive-cleanup workflows should require declared evidence skeleton parity. If Phase 11 lists 8 evidence files, those files must exist in `outputs/phase-11/` during spec_created close-out.

## ドキュメント改善

CLOSED parent issue follow-ups need a standard rule: use `Refs #<parent>` only and forbid `Closes #<parent>`. This prevents stale close/reopen semantics in GitHub while keeping traceability.

## Routing

| Item | Target | Action |
| --- | --- | --- |
| Destructive operation Phase 11/13 template | `.claude/skills/task-specification-creator/references/phase-template-phase11.md` and Phase 13 docs | candidate for future skill update |
| Evidence skeleton parity | `phase-12-spec.md` compliance guidance | candidate for future skill update |
| CLOSED parent `Refs` rule | task-specification references / lessons | candidate for future skill update |

No skill file is changed in this cycle because the current task can be made compliant by correcting the workflow artifacts directly.
