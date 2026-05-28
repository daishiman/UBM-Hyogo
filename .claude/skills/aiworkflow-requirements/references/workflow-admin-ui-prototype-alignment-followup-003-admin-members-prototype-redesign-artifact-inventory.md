# workflow-admin-ui-prototype-alignment-followup-003-admin-members-prototype-redesign artifact inventory

| Item | Path |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/admin-ui-prototype-alignment-followup-003-admin-members-prototype-redesign/` |
| root artifacts | `docs/30-workflows/completed-tasks/admin-ui-prototype-alignment-followup-003-admin-members-prototype-redesign/artifacts.json` |
| Phase 11 main | `docs/30-workflows/completed-tasks/admin-ui-prototype-alignment-followup-003-admin-members-prototype-redesign/outputs/phase-11/main.md` |
| Phase 11 screenshots | `docs/30-workflows/completed-tasks/admin-ui-prototype-alignment-followup-003-admin-members-prototype-redesign/outputs/phase-11/screenshots/` |
| Phase 11 screenshot inventory | `docs/30-workflows/completed-tasks/admin-ui-prototype-alignment-followup-003-admin-members-prototype-redesign/outputs/phase-11/screenshot-inventory.json` |
| Phase 12 main | `docs/30-workflows/completed-tasks/admin-ui-prototype-alignment-followup-003-admin-members-prototype-redesign/outputs/phase-12/main.md` |
| Phase 12 implementation guide | `docs/30-workflows/completed-tasks/admin-ui-prototype-alignment-followup-003-admin-members-prototype-redesign/outputs/phase-12/implementation-guide.md` |
| Phase 12 compliance | `docs/30-workflows/completed-tasks/admin-ui-prototype-alignment-followup-003-admin-members-prototype-redesign/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| parent workflow | `docs/30-workflows/admin-ui-prototype-alignment/` |
| predecessor | `docs/30-workflows/completed-tasks/admin-ui-prototype-alignment-followup-002-section-error-retry/` |
| historical admin members baseline | `docs/30-workflows/completed-tasks/06c-B-admin-members/` |
| prototype source | `docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx` |
| admin blueprint | `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` |

## Contract

`admin-ui-prototype-alignment-followup-003-admin-members-prototype-redesign` is registered as `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION`.

The workflow implements an in-place rewrite of `/admin/members` to match the admin prototype and captures local visual evidence. It does not add API endpoints, D1 schema, or shared response fields. API gaps are handled by web-layer adapters and explicit downstream follow-up candidates.

Implementation targets are `apps/web/src/features/admin/components/_members/**`, `apps/web/src/features/admin/components/_shared/{TagPill,PillNav}.tsx`, `apps/web/src/lib/admin/member-hue.ts`, `apps/web/app/(admin)/admin/members/page.tsx`, and `apps/web/src/styles/globals.css`.

Staging deploy, authenticated staging visual screenshots, commit, push, and PR are user-gated.
