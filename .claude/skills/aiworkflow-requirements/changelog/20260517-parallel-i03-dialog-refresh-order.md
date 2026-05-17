# 2026-05-17 parallel-i03-dialog-refresh-order

Synchronized `docs/30-workflows/parallel-i03-dialog-refresh-order/` as `implemented_local_evidence_captured / implementation / NON_VISUAL`.

Implemented the profile request dialog success order `router.refresh() -> onSubmitted -> onClose()` in `VisibilityRequestDialog` and `DeleteRequestDialog`, removed parent-side refresh from `RequestActionPanel`, and added component specs for order and parent non-refresh assertions.

Phase 12 strict 7 outputs, artifact inventory, quick-reference, resource-map, task-workflow-active, source spec canonical marker, and LOGS were updated in the same wave. Lessons learned were captured as `references/lessons-learned-parallel-i03-dialog-refresh-order-2026-05.md` (L-PARALLEL-I03-001..005: refresh order contract, 409 branch review gate, `vi.hoisted` callOrder pattern, parent-spec child-dialog inline mock, completed-tasks path drift). The 409 duplicate-pending branch was confirmed to also call `router.refresh()`. Commit / push / PR remain user-gated.
