# Lessons Learned: home-page-prototype-alignment

## L-HOMEALIGN-001: Dirty `apps/` diffs must reclassify visual workflows out of spec-created

When a VISUAL implementation workflow gains real `apps/` changes, leaving `workflow_state=spec_created` creates a false boundary. Reclassify to `implemented` (or the appropriate local-runtime state), update root/output artifacts, and make Phase 11 evidence match the real code state in the same cycle.

## L-HOMEALIGN-002: Prototype CSS specs must verify real script names and test filenames

Implementation specs should reference actual local commands and test files. In this workflow, `pnpm verify:design-tokens` and `CallToActionCTA.spec.tsx` drifted from repo reality; the correct references are `pnpm verify:tokens` and `CallToActionCTA.component.spec.tsx`.

## L-HOMEALIGN-003: Same-wave aiworkflow sync is part of spec readiness

For implementation-ready workflow packages, quick-reference/resource-map/task-workflow-active plus artifact inventory, lessons, changelog, and LOGS should be updated in the same cycle as Phase 12 strict 7. Otherwise the workflow exists physically but is hard to discover through the requirements skill.

## L-HOMEALIGN-004: Shared CSS tasks should default to serial ownership

Even if TSX ownership differs, two tasks editing `legacy-public.css` should be serialized unless marker scopes are fully disjoint. Here task-01 owns the new marker block and task-02 owns the existing CTA selector rewrite after task-01.

## L-HOMEALIGN-005: Local screenshot capture can isolate CSS validation from unrelated client prefetch failures

If the target page server-renders correctly but JavaScript prefetch triggers an unrelated route/env error, capture CSS selector evidence with JavaScript disabled and document that boundary. Do not use that as a staging PASS; record it as local server-rendered visual evidence and keep deploy validation user-gated.

## L-HOMEALIGN-006: Token gate fails on preexisting violations in adjacent routes, not just current diff

`pnpm verify:tokens` scans the entire workspace, so a touch-free route can fail the current cycle if it carried preexisting HEX literals or negative `letter-spacing`. In this workflow `apps/web/app/opengraph-image.tsx` and `apps/web/app/(public)/members/[id]/opengraph-image/route.tsx` were not in scope of task-01 / task-02, but their preexisting HEX violations surfaced under the same gate. The pattern: run `pnpm verify:tokens` proactively at the start of any cycle that may touch design tokens or CSS, and absorb adjacent fixes inside the same cycle rather than deferring them as separate followups.

## L-HOMEALIGN-007: Followup tasks belong in `docs/30-workflows/unassigned-task/`, never in `completed-tasks/` root

Followup task files generated from `outputs/phase-12/unassigned-task-detection.md` must live under `docs/30-workflows/unassigned-task/` (flat directory). Placing them at `docs/30-workflows/completed-tasks/<file>.md` (sibling to workflow dirs) bypasses the unassigned-task pre-flight gate and detaches them from the requirements skill discovery surface. When in doubt, follow the existing convention seen in `docs/30-workflows/unassigned-task/*-followup-*.md`.
