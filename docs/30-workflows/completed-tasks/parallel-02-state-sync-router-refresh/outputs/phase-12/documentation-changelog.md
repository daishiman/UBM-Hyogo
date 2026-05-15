# Documentation Changelog

| Date | Scope | Change |
| --- | --- | --- |
| 2026-05-15 | workflow root | `parallel-02-state-sync-router-refresh` を implementation / VISUAL workflow として追加 |
| 2026-05-15 | apps/web profile | dialog success branch の `router.refresh()` と parent bridge state を実装 |
| 2026-05-15 | Phase 11 | selector を実装済み `role=status` / `data-pending-type` に同期 |
| 2026-05-15 | Phase 12 | strict 7 outputs と root/output artifacts parity を追加 |

## Validator / Command Log

| Command | Exit | Note |
| --- | --- | --- |
| `pnpm typecheck` | 0 | all workspace typecheck PASS |
| `pnpm lint` | 0 | boundary / dependency-cruiser / stablekey / workspace lint PASS |
| `pnpm --filter @ubm-hyogo/web test -- RequestActionPanel.component.spec.tsx` | 0 | 83 files / 561 tests PASS, 1 skipped |
