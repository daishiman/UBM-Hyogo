# Documentation Changelog

## 2026-05-19

| Path | Change |
| --- | --- |
| `apps/web/app/profile/loading.tsx` | text-only placeholder を skeleton fallback に置換 |
| `apps/web/app/profile/loading.spec.tsx` | a11y / skeleton structure tests 4件を追加 |
| `docs/30-workflows/profile-loading-skeleton-oklch/` | canonical workflow root / artifacts / Phase 11 evidence / Phase 12 strict 7 を追加 |
| `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/index.md` | i07 を implemented に更新 |
| `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i07-profile-loading-skeleton/spec.md` | canonical workflow 参照へ更新 |
| `docs/30-workflows/unassigned-task/integration-fixes-i07-profile-loading-skeleton.md` | consumed trace を追加 |
| `.claude/skills/aiworkflow-requirements/indexes/*` | profile-loading-skeleton-oklch 導線を追加 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | active workflow entry を追加 |
| `.claude/skills/aiworkflow-requirements/references/workflow-profile-loading-skeleton-oklch-artifact-inventory.md` | artifact inventory を追加 |

## Command Evidence

| Command | Evidence |
| --- | --- |
| `mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run profile/loading` | `outputs/phase-11/evidence/test.log` |
| `mise exec -- pnpm typecheck` | `outputs/phase-11/evidence/typecheck.log` |
| `mise exec -- pnpm lint` | `outputs/phase-11/evidence/lint.log` |
| `mise exec -- pnpm -F "@ubm-hyogo/web" build` | `outputs/phase-11/evidence/build.log` |
| grep gates | `outputs/phase-11/evidence/grep-gate.log` |
