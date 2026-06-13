# Workflow Artifact Inventory: vitest-3-to-4-major-upgrade

## Overview

| Item | Value |
| --- | --- |
| workflow root | `docs/30-workflows/vitest-3-to-4-major-upgrade/` |
| status | `implementation_review_partial / implementation / NON_VISUAL / full_shard_pending_node_arch` |
| issue | Issue #1200 CLOSED. Keep PR references as `Refs #1200`; do not reopen or mutate the issue without user approval |
| source | `docs/30-workflows/unassigned-task/vitest-2-to-3-major-upgrade-followup-001-vitest-4-major-upgrade.md` |
| parent workflow | `docs/30-workflows/completed-tasks/vitest-2-to-3-major-upgrade/` |

## Purpose

Define the execution contract for upgrading Vitest from 3.2.6 to 4.1.8 across the monorepo while keeping `@vitest/coverage-v8` exactly aligned, updating `@vitejs/plugin-react` to a Vite 6-8 compatible 5.x line, preserving D1 test serialization, and proving all test and coverage shards green before PR creation.

## Canonical Workflow Files

| Artifact | Path | Status |
| --- | --- | --- |
| workflow entry | `docs/30-workflows/vitest-3-to-4-major-upgrade/index.md` | present |
| root ledger | `docs/30-workflows/vitest-3-to-4-major-upgrade/artifacts.json` | present |
| output mirror ledger | `docs/30-workflows/vitest-3-to-4-major-upgrade/outputs/artifacts.json` | present |
| Phase 1-13 specs | `docs/30-workflows/vitest-3-to-4-major-upgrade/phase-01-requirements.md` ... `phase-13-pr-creation.md` | present |
| Phase 11 placeholder | `docs/30-workflows/vitest-3-to-4-major-upgrade/outputs/phase-11/manual-test-result.md` | present, pending evidence |
| Phase 12 strict 7 | `docs/30-workflows/vitest-3-to-4-major-upgrade/outputs/phase-12/` | present |

## Planned Implementation Targets

| Target | Planned change |
| --- | --- |
| `package.json` | `vitest` and `@vitest/coverage-v8` to `^4.1.8`; `@vitejs/plugin-react` to `^5.2.0` |
| `apps/api/package.json` | `vitest` to `^4.1.8`; remove `--minWorkers=1` from `test:coverage:unit` |
| `apps/og/package.json` | `vitest` to `^4.1.8` |
| `pnpm-lock.yaml` | regenerate after dependency bump |
| `vitest.d1.config.ts` | replace `poolOptions.forks.singleFork: true` with `maxWorkers: 1` while keeping `pool: "forks"`; omit `isolate: false` because it pollutes D1 mock module state; use D1-only 180s timeout for cold migration |
| `*.spec.ts(x)` / snapshots / coverage gates | only minimal RED-observed fixes for Vitest 4 breaking changes |

## Current Registry Snapshot

Registry facts were rechecked on 2026-06-13 JST.

| Package | Current fact |
| --- | --- |
| `vitest` | npm `latest` is `4.1.8`; `beta` is `5.0.0-beta.4`; `V3` tag is `3.2.6`; engines are `^20.0.0 || ^22.0.0 || >=24.0.0`; dependency `vite` range is `^6.0.0 || ^7.0.0 || ^8.0.0` |
| `@vitest/coverage-v8` | npm `latest` is `4.1.8`; peer `vitest: 4.1.8` requires exact alignment |
| `@vitejs/plugin-react@5.2.0` | peer `vite: ^4.2.0 || ^5.0.0 || ^6.0.0 || ^7.0.0 || ^8.0.0` |
| `@vitejs/plugin-react` latest | `6.0.2`, but it peers only with `vite: ^8.0.0`; the workflow intentionally targets 5.2.0 to remain compatible with Vitest's Vite 6/7/8 resolution range |

## Evidence Boundary

This workflow has local implementation changes and partial evidence. Full shard evidence is pending because the current terminal runs x64 Node and fails the repository's `verify:node-arch` guard (`process.arch=x64`, expected `arm64`). NON_VISUAL screenshot evidence is `n/a`.

## Lessons Learned

- **L-V3V4-001**: For dependency-upgrade specs, a `spec_created` workflow still needs aiworkflow ledger visibility in the same review wave; otherwise the workflow exists locally but is not discoverable through canonical skill indexes.
- **L-V3V4-002**: Registry claims such as "latest" must be revalidated at close-out time and recorded with an exact date. If the target remains unchanged, add the validation note instead of changing the target.
- **L-V3V4-003**: Avoid blindly selecting the package latest when peer range compatibility is the actual objective. `@vitejs/plugin-react@6` is newer, but `5.2.0` is the target because it spans Vite 4.2-8 while Vitest 4 may resolve Vite 6, 7, or 8.
- **L-V3V4-004**: Do not blindly apply migration-guide `singleFork` equivalence. `isolate: false` is close to the old single-fork process model, but this repo's shared D1 mock relies on file-level isolation. Preserve serialization with `maxWorkers: 1` and keep isolation at its default unless full D1 shard evidence proves otherwise.
