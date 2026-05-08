# 2026-05-07 task-21 09g Admin Screen Blueprints

task-21 W2 parallel admin screen blueprint を `spec_created / docs-only / NON_VISUAL` として同期した。

- primary spec: `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md`
- workflow root: `docs/30-workflows/completed-tasks/task-21-w2-par-screen-blueprints-admin/`
- verify: `scripts/verify-09g-screen-blueprints-admin.sh`
- state: Phase 1-12 completed / Phase 13 blocked_pending_user_approval

旧 draft の 1779 行・stale API・視覚値 literal を撤回し、current `references/api-endpoints.md` admin contract へ同期した。採用 API は `/admin/dashboard`、`/admin/tags/queue/:queueId/resolve`、`/admin/schema/aliases`、identity `merge` / `dismiss` を含む current surface とする。
