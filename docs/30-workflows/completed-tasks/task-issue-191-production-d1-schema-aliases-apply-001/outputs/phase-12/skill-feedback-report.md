# Skill Feedback Report

| Item | Promotion target | Routing |
| --- | --- | --- |
| Approval-gated production D1 apply needs canonical Phase 12 outputs before runtime evidence | `task-specification-creator/references/phase-12-spec.md` | no-op reason: existing production-operation examples already require strict Phase 12 files; evidence path: this workflow `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| `local applied` and `production applied` must not collapse into one state | `aiworkflow-requirements/references/database-schema.md` | promoted in wave: `database-schema.md` now marks `schema_aliases` as production applied only after Phase 13 ledger + PRAGMA evidence; evidence path: `outputs/phase-13/` |
| D1 migration apply may apply all pending migrations, not just the named intent | `task-specification-creator/references/phase-template-phase13.md` | candidate for future template improvement; resolved locally as E-9/P-1 NO-GO; evidence path: `phase-04.md`, `phase-06.md`, `phase-10.md`, `phase-13.md` |
| Phase 13 PR/push gate should be separate from D1 apply gate | `task-specification-creator/references/phase-template-phase13.md` | no-op reason: current template supports multiple gates; resolved locally by Gate-C1/Gate-C2 split; evidence path: `phase-13.md` |

## Result

`aiworkflow-requirements/SKILL.md` changelog is updated for same-wave sync. No `task-specification-creator` template edit is required in this patch because the D1 pending-migration guard is task-specific evidence, not yet a repeated template rule.
