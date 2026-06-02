# Workflow Artifact Inventory: publish-state-backfill-admin-ui

## Summary

| Item | Value |
|------|-------|
| workflow root | `docs/30-workflows/completed-tasks/publish-state-backfill-admin-ui/` |
| status | `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` |
| parent workflow | `docs/30-workflows/task-member-publish-recovery-form-ops-and-admin-link/` |
| source task | `docs/30-workflows/task-member-publish-recovery-form-ops-and-admin-link/tasks/A-publish-state-backfill-admin-ui.md` |
| landed implementation | PR #1064 / commit `745c95115` |

## Workflow Artifacts

| Artifact | Path | Status |
|----------|------|--------|
| index | `docs/30-workflows/completed-tasks/publish-state-backfill-admin-ui/index.md` | present |
| root artifacts | `docs/30-workflows/completed-tasks/publish-state-backfill-admin-ui/artifacts.json` | present |
| output artifacts mirror | `docs/30-workflows/completed-tasks/publish-state-backfill-admin-ui/outputs/artifacts.json` | present |
| Phase 1-13 specs | `docs/30-workflows/completed-tasks/publish-state-backfill-admin-ui/phase-*.md` | present |
| Phase 11 evidence index | `docs/30-workflows/completed-tasks/publish-state-backfill-admin-ui/outputs/phase-11/main.md` | present |
| Phase 12 compliance | `docs/30-workflows/completed-tasks/publish-state-backfill-admin-ui/outputs/phase-12/phase12-task-spec-compliance-check.md` | present |
| Phase 13 pre-PR summary | `docs/30-workflows/completed-tasks/publish-state-backfill-admin-ui/outputs/phase-13/change-summary.md` | present |

## Implementation Targets

| Target | Path | Status |
|--------|------|--------|
| web schema/path | `apps/web/src/features/admin/diagnostics/backfill.ts` | landed via #1064 |
| admin panel | `apps/web/src/features/admin/components/_sync/BackfillPublishStatePanel.client.tsx` | landed via #1064 |
| page mount | `apps/web/app/(admin)/admin/sync-status/page.tsx` | landed via #1064 |
| panel tests | `apps/web/src/features/admin/components/_sync/__tests__/BackfillPublishStatePanel.spec.tsx` | landed via #1064 |
| schema tests | `apps/web/src/features/admin/diagnostics/__tests__/sync-schemas.spec.ts` | landed via #1064 |
| endpoint | `apps/api/src/routes/admin/sync-backfill-publish-state.ts` | reused unchanged |

## Boundaries

- API/D1/Form schema: no change.
- Runtime visual evidence: staging authenticated screenshots are user-gated.
- Git operations: commit / push / PR are user-gated.
- Corrected source drift: source task's corrupted path is superseded by `BACKFILL_PUBLISH_STATE_PATH = "/api/admin/sync/backfill-publish-state"`.
- activeMode per-button busy: loading 判定を完了済み `mode` から in-flight 専用 `activeMode` state へ分離し（`try/finally` で `setActiveMode(null)`）、押されたボタンだけ busy にする。回帰 test `TC-A4b`。

## Lessons Learned

詳細: [lessons-learned-publish-state-backfill-admin-ui-2026-06.md](lessons-learned-publish-state-backfill-admin-ui-2026-06.md)

| ID | Lesson |
| --- | --- |
| L-PSB-001 | 複数アクションボタンの loading は in-flight 専用 `activeMode` state で分離する（`try/finally` クリア、回帰 `TC-A4b`） |
| L-PSB-002 | landed 済み実装の後追い正本化は Phase 1 に乖離補正表を必須化し source drift を補正してから進める |
| L-PSB-003 | 破壊的 backfill apply は dry-run 先行 + `confirm` + in-flight ref の 3 重ガードで多重/未確認実行を防ぐ |
| L-PSB-004 | endpoint レスポンスは zod `.strict()` で検証し parse 失敗時は描画しない fail-closed UI |
| L-PSB-005 | admin mutation は `@/features/admin/hooks/useAdminMutation` 経由を標準とし legacy `@/lib/useAdminMutation` を新規参照しない |
| L-PSB-006 | VISUAL_ON_EXECUTION は Phase 11 を deterministic plan evidence で一次証跡化し staging authenticated screenshots を user-gated に分離する |
