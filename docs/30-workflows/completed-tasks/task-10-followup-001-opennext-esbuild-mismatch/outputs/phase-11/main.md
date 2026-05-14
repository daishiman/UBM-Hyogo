# Phase 11 Evidence Ledger

Status: PASS (`implemented-local`)

## Acceptance Evidence

| AC | Evidence | Result |
| --- | --- | --- |
| AC-1 build:cloudflare | `evidence/after-build-cloudflare.log` | PASS: OpenNext build complete / worker patched |
| AC-2 esbuild convergence | `evidence/after-pnpm-why-esbuild.log`, `evidence/esbuild-versions.log` | PASS: `Found 1 version of esbuild`, platform binary `0.25.4` |
| AC-3 root + web regression | `evidence/root-typecheck.log`, `evidence/root-lint.log`, `evidence/web-typecheck.log`, `evidence/web-lint.log`, `evidence/web-ui-test.log` | PASS |
| AC-4 wrangler path | `evidence/api-build.log`, `evidence/cf-sh-wrapper-version.log` | PASS: API build and wrapper-local wrangler `4.85.0` version smoke |
| AC-5 lockfile scope | `evidence/code-diff.patch`, `evidence/git-diff-stat.txt` | PASS: esbuild override; downstream runtime evidence changes are explicitly separated |
| AC-6 recovery note | `scripts/cf.sh` header | PASS |

## Notes

- `scripts/cf.sh` fallback implementation was not required because `pnpm.overrides.esbuild = "0.25.4"` resolved the host/binary mismatch.
- `CF_SH_SKIP_WITH_ENV=1 bash scripts/cf.sh --version` was used for wrapper smoke to avoid requiring 1Password desktop authentication for a read-only version check.
- UI runtime/a11y changes belong to the downstream follow-up 002 evidence capture and are stored under the parent task-10 evidence root.
- The downstream visual evidence task was unblocked and executed in the same cycle; see `docs/30-workflows/completed-tasks/task-10-ui-primitives-spec/outputs/phase-11/evidence/`.
