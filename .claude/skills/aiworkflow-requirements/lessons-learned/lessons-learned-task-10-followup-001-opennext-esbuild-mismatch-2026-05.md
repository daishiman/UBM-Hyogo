# Lessons Learned: task-10 follow-up 001 OpenNext esbuild mismatch

## L-T10FU001-001: OpenNext host/binary mismatch should be solved at dependency convergence first

When `@opennextjs/aws` reports `Host version "0.25.4" does not match binary version "0.21.5"`, prefer proving the effective workspace esbuild graph before adding wrapper-specific fallback logic. In this cycle, root `pnpm.overrides.esbuild = "0.25.4"` converged the graph and recovered `build:cloudflare`.

## L-T10FU001-002: Wrapper smoke is not a replacement for build evidence

`CF_SH_SKIP_WITH_ENV=1 bash scripts/cf.sh --version` only proves the local Wrangler wrapper can start. It must be paired with `build:cloudflare` and dependency scan evidence before marking the blocker resolved.

## L-T10FU001-003: Same-cycle downstream visual evidence still needs an explicit boundary

The build-toolchain fix is NON_VISUAL. Runtime screenshot and axe evidence belong to task-10 / follow-up 002, even when the unblock and capture happen in the same execution cycle.

