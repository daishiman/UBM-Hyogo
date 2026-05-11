# 2026-05-09 task-10 UI primitives implemented-local sync

## Summary

`docs/30-workflows/completed-tasks/task-10-ui-primitives-spec/` を `implemented-local-build-blocked / implementation / VISUAL_ON_EXECUTION / existing-ui-integration` として同期した。

## Code

- `apps/web/src/components/ui/` に task-10 の 11 primitive contract を実装。
- `Card / Badge / Sidebar / Stat / EmptyState / Banner` を追加。
- `Button / Avatar / Field / Input / Select` を後方互換で拡張。
- `apps/web/src/lib/cn.ts` と `apps/web/src/components/ui/__tests__/task10-contract.test.tsx` を追加。

## Evidence

- `pnpm --filter @ubm-hyogo/web typecheck`: PASS
- `pnpm --filter @ubm-hyogo/web lint`: PASS
- `pnpm --filter @ubm-hyogo/web test apps/web/src/components/ui/__tests__/task10-contract.test.tsx apps/web/src/components/ui/__tests__/primitives.test.tsx`: PASS（50 files / 427 tests）
- `pnpm --filter @ubm-hyogo/web test:coverage`: PASS（All files 83.47/87.29/83.19/83.47）
- `pnpm --filter @ubm-hyogo/web build`: PASS
- `pnpm --filter @ubm-hyogo/web build:cloudflare`: FAIL（OpenNext esbuild host `0.25.4` / binary `0.21.5` mismatch）

## Boundary

Runtime screenshot / axe evidence and Phase 13 remain pending until the Cloudflare build blocker is resolved. Commit / push / PR were not executed.
