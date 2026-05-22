# Lessons Learned: admin-tags-queue-resolver-drawer (2026-05)

## L-ATQRD-001: current topology beats generated `_components` premise

`step-04-tags-assignment/spec.md` assumed new `apps/web/app/(admin)/admin/tags/_components/*`, but current implementation already owns `/admin/tags` through `apps/web/src/components/admin/TagQueuePanel.tsx`. The implementation root must be reclassified as existing hardening before writing files.

## L-ATQRD-002: admin mutation invariant must distinguish helper layer from hook layer

Older guidance said admin mutations must go through `apps/web/src/lib/admin/api.ts`. Serial-05 tasks introduced `useAdminMutation` as the normalized client mutation hook for `/api/admin/*` BFF calls. Specs must state whether they use the legacy helper or the hook-level BFF path so invariant #5/#13 remains clear.

## L-ATQRD-003: endpoint names need layer labels

`/admin/tags/queue/:queueId/resolve` is the upstream `apps/api` route; `/api/admin/tags/queue/:queueId/resolve` is the Next.js BFF/browser path. Writing both without labels creates false drift.

## L-ATQRD-004: idempotent UX belongs in one toast path

If `useAdminMutation` always emits success toast, drawer-specific `onSuccess` must not emit a second toast. Use a `successMessage(data)` mapper in the hook to handle `idempotent: true`.

## L-ATQRD-005: success toast action must not depend on async React state

Drawer submit can switch from confirmed to rejected immediately before calling `trigger`. Store the submitted action in a ref or derive it from the response; otherwise the hook can evaluate `successMessage` before React applies the new state and show the wrong toast.

## L-ATQRD-006: completed-tasks/ relocation requires path drift sweep

When a workflow root is moved into `docs/30-workflows/completed-tasks/<workflow-id>/`, every internal `evidence_path`, Phase 12 path label, source-spec superseded pointer, and skill index entry (resource-map / quick-reference / SKILL.md / SKILL-changelog / LOGS / changelog / task-workflow-active) must be rewritten with the `completed-tasks/` segment in the same wave. Phase 12 path drift checks must grep both `docs/30-workflows/<workflow-id>/` and `docs/30-workflows/completed-tasks/<workflow-id>/` and treat any remaining bare form as drift.

## L-ATQRD-007: Phase 12 strict-7 verdict labels must use workflow_state vocabulary

`workflow_state` vocabulary (`implemented_local_evidence_captured` etc.) must be used in Phase 12 strict-7 verdict cells. Legacy labels like `spec_created` against `taskType` / `visualEvidence` rows misclassify implementation-bearing tasks and break same-wave parity with `automation-30` reclassification.
