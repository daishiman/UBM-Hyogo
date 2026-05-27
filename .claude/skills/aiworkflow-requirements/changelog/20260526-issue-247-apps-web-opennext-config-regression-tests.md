# 2026-05-26 issue-247 apps/web OpenNext config regression tests

Issue #247 を `implemented_local_evidence_captured / implementation / NON_VISUAL` として同期。

## Implementation

- Added `apps/web/__tests__/opennext-config-regression.spec.ts`.
- Added `.github/workflows/ci.yml` focused `OpenNext config regression guard` step.
- Guarded against `pages_build_output_dir` reintroduction, OpenNext assets binding drift, package deploy script drift, and `.assetsignore` required-line drift.

## Same-Wave Sync

- Updated `references/deployment-cloudflare-opennext-workers.md`.
- Updated `indexes/quick-reference.md`, `indexes/resource-map.md`, and `references/task-workflow-active.md`.
- Added workflow artifact inventory and lessons-learned.
- Updated workflow Phase 12 outputs to remove pending sync false green.

## Boundary

Commit, push, PR creation, and GitHub Issue #247 mutation remain user-gated.
