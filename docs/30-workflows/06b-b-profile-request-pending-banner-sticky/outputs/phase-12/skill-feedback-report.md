# Skill Feedback Report — 06b-b-profile-request-pending-banner-sticky-001

## task-specification-creator

| Item | Routing | Evidence |
| --- | --- | --- |
| Storage source-of-truth grep before Phase 2/5 | promoted to `.claude/skills/task-specification-creator/SKILL.md` changelog | The initial draft used an obsolete placeholder table; current repo uses `admin_member_notes` |
| Wire error code vs display vocabulary separation | promoted to `.claude/skills/task-specification-creator/SKILL.md` changelog | Existing code uses `DUPLICATE_PENDING_REQUEST`; natural-language lowercase drift caused inconsistency |
| Web/API mirror type checklist | promoted to `.claude/skills/task-specification-creator/SKILL.md` changelog | `apps/web/src/lib/api/me-types.ts` must be listed when API response shape changes |
| implemented-local reclassification | promoted to `.claude/skills/task-specification-creator/SKILL.md` changelog | Code/tests existed while artifacts still said `spec_created`; Phase 12 must reclassify lifecycle in the same wave |
| pending-only read predicate | promoted to `.claude/skills/task-specification-creator/SKILL.md` changelog | Read model and duplicate guard must use the same `request_status='pending'` predicate |

## aiworkflow-requirements

| Item | Routing | Evidence |
| --- | --- | --- |
| 04b/06b self-service queue storage route | promoted to `.claude/skills/aiworkflow-requirements/SKILL.md` changelog | quick-reference/resource-map point implementers to `admin_member_notes` pending rows |
| Sticky banner manual spec promotion | promoted to manual specs and `.claude/skills/aiworkflow-requirements/SKILL.md` changelog | Manual specs now describe implemented server-side sticky pending behavior |

## Direct SKILL.md Edits

This execution promoted the feedback directly because the gaps were found during the implementation close-out cycle:

- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
