# Skill Feedback Report — 06b-b-profile-request-pending-banner-sticky-001

## task-specification-creator

| Item | Routing | Evidence |
| --- | --- | --- |
| Storage source-of-truth grep before Phase 2/5 | owning skill feedback | The initial draft used an obsolete placeholder table; current repo uses `admin_member_notes` |
| Wire error code vs display vocabulary separation | owning skill feedback | Existing code uses `DUPLICATE_PENDING_REQUEST`; natural-language lowercase drift caused inconsistency |
| Web/API mirror type checklist | owning skill feedback | `apps/web/src/lib/api/me-types.ts` must be listed when API response shape changes |

## aiworkflow-requirements

| Item | Routing | Evidence |
| --- | --- | --- |
| 04b/06b self-service queue storage route | requirements feedback | quick-reference/resource-map should point implementers to `admin_member_notes` pending rows |
| Sticky banner manual spec promotion | no-op until implementation | Manual specs should be updated after actual code and tests exist, not during spec-only formalization |

## No direct SKILL.md edits

This execution records feedback in the workflow artifact only. The owning skills can promote the feedback in a later skill-maintenance cycle.
