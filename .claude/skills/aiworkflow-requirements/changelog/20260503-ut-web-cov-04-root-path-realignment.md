# 2026-05-03 ut-web-cov-04 root path realignment

- `docs/30-workflows/completed-tasks/ut-web-cov-04-admin-lib-ui-primitives-coverage/` を current canonical root として同期。
- 旧 `docs/30-workflows/ut-coverage-2026-05-wave/wave-2-parallel-coverage/ut-web-cov-04-admin-lib-ui-primitives-coverage/` は historical wave grouping path に降格。
- root / outputs `artifacts.json` の `task_path`、wave README link、artifact inventory、quick-reference、resource-map、task-workflow-active、lessons hub を同一 wave で更新対象にする。
- Phase 11/12 measured evidence: `mise exec -- pnpm --filter @ubm-hyogo/web test` PASS (44 files / 322 tests), `mise exec -- pnpm --filter @ubm-hyogo/web test:coverage` PASS (44 files / 322 tests), 13 target files all AC PASS（NON_VISUAL）。
- evidence 出典: `outputs/phase-11/main.md`, `outputs/phase-11/coverage-after.json`, `outputs/phase-11/coverage-diff.md`, `outputs/phase-12/`（strict 7 files）。
