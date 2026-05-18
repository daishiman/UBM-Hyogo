# Lessons Learned: fix-cf-deploy-esbuild-import-source-staging-failure

## メタ情報

| 項目 | 値 |
| --- | --- |
| Workflow | `docs/30-workflows/fix-cf-deploy-esbuild-import-source-staging-failure/` |
| Date | 2026-05-17 |
| State | `implemented_local_evidence_captured / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` |
| Scope | Cloudflare deploy esbuild `import-source` parser failure recovery |

## Lessons

### L-FIXCF-001: Historical esbuild fixes must not remain current SSOT

Task-10 follow-up 001 correctly fixed an older OpenNext host/binary mismatch with `pnpm.overrides.esbuild = 0.25.4`, but wrangler 4.85.0 later required an esbuild version that understands the `import-source` supported feature. Historical success must be labelled historical when the root override SSOT changes.

Operational rule: current Cloudflare deploy recovery must read `package.json#pnpm.overrides.esbuild` first, then link older workflow inventories as superseded evidence only.

### L-FIXCF-002: Missing completed roots require retargeting, not duplicate canonicals

The stale `completed-tasks/fix-wrangler-esbuild-import-source-error/` path was not a valid root in this worktree. The correct close-out action is to retarget indexes and active workflow entries to the real 2026-05-17 workflow root instead of preserving a missing completed path as a pseudo-canonical.

### L-FIXCF-003: `import-source` parser recovery and deploy green are separate gates

`pnpm why esbuild`, `pnpm exec esbuild --version`, and API wrangler dry-run can prove esbuild convergence and parser recovery. They do not prove full deploy recovery. `build:cloudflare` and GitHub Actions deploy jobs remain runtime evidence and must stay behind `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` until captured.

### L-FIXCF-004: Same-wave Phase state must mirror runtime boundaries

If root artifacts mark Phase 5 / 6 / 7 / 9 / 11 as `runtime_pending`, the corresponding Phase markdown must not say plain `completed`. Completed local evidence and pending runtime evidence need separate checklist rows to avoid review drift.

### L-FIXCF-005: Miniflare/workerd blockers must be classified by symptom

The web `build:cloudflare` command currently stops at a Miniflare/workerd SQLite readonly database startup error, while the original `import-source` parser error does not recur. That distinction keeps the dependency fix valid while preventing premature deploy-complete language.

