# Phase 11 Contract Walkthrough

## Summary verdict

`implemented_local_runtime_pending` — this workflow root now includes the local Playwright/config/workflow implementation. Runtime screenshots, CI artifacts, baseline update, commit, push, and PR remain pending user-gated runtime workflows.

## Evidence boundary

| Evidence class | Status | Canonical handling |
| --- | --- | --- |
| Local implementation walkthrough | `implemented_local` | Captured in this file and sibling Phase 11 checklist files |
| 51 baseline screenshots | `runtime_pending` | Must be created by the implementation cycle under `apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots/` |
| CI artifacts | `runtime_pending` | Must be produced by `.github/workflows/playwright-visual-full.yml` after baseline bootstrap |
| Baseline update | `blocked` | User approval via `visual-baseline-approval` environment is required |

## Required follow-up before visual completion claim

1. Generate 51 Linux baselines from approved CI/runtime path, not from macOS local screenshots.
2. Record command output as tracked `.txt` / `.json` files, not `.log`.
3. Confirm `pnpm --filter @ubm-hyogo/web test:visual-full` passes after baselines exist.
4. Reclassify root only after baseline files and runtime evidence exist.

## Linked Phase 11 files

- [manual-smoke-log.md](./manual-smoke-log.md)
- [link-checklist.md](./link-checklist.md)
