# 2026-05-11 task-10 follow-up 002 runtime visual + axe evidence

## Summary

`docs/30-workflows/completed-tasks/task-10-followup-002-runtime-visual-axe-evidence/` を `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION` として同期した。

## Implementation

- `apps/web/app/(dev)/primitives-harness/page.tsx` に 11 primitive / 37 variant の visual harness を追加。
- `apps/web/app/(dev)/layout.tsx` で production runtime harness access を `ENABLE_PRIMITIVES_HARNESS=1` に限定。
- `apps/web/playwright/tests/ui-primitives-visual.spec.ts` で screenshot capture と axe JSON output を定義。
- `apps/web/playwright.config.ts` に `PLAYWRIGHT_EVIDENCE_TASK=task-10-followup-002` evidence dir 分岐を追加。
- `apps/web/src/components/ui/Stat.tsx` と `apps/web/src/components/ui/Sidebar.tsx` の HTML 意味論を後方互換に補正し、axe violations 0 を達成。

## Boundary

Runtime screenshot 37 files and axe violations 0 are captured under the workflow evidence directory. `build:cloudflare` remains blocked by task-10-followup-001 esbuild host/binary mismatch. Commit, push, PR, staging deploy, and production smoke are user-gated.
