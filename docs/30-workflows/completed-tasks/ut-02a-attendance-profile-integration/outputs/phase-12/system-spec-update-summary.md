# System Spec Update Summary

## Same-Wave Sync Required On Execution

| Target | Required Update |
| --- | --- |
| `docs/00-getting-started-manual/specs/01-api-schema.md` | Add attendance read path for `MemberProfile.attendance` |
| `docs/00-getting-started-manual/specs/08-free-database.md` | Add D1 bind limit and 80-id chunk strategy note |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | Register this workflow as the canonical follow-up |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | Add attendance profile implementation quick reference |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | Register implemented workflow with Phase 1-12 complete / Phase 13 pending |
| `.claude/skills/aiworkflow-requirements/references/legacy-ordinal-family-register.md` | Map legacy single-sheet task to canonical workflow root |
| `docs/30-workflows/completed-tasks/02a-parallel-member-identity-status-and-response-repository/outputs/phase-12/unassigned-task-detection.md` | Mark this item formalized, not implemented |

## Boundary

The current change is an implementation close-out. Phase 11 uses NON_VISUAL local evidence; authenticated staging curl remains part of later staging smoke workflows.
