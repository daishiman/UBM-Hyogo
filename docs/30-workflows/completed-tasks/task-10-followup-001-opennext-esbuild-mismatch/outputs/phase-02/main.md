# Phase 2 Output: Design

Status: completed

## Result

- Adopted root `pnpm.overrides.esbuild = "0.25.4"` after local verification showed it resolves the mismatch without needing an OpenNext-specific `scripts/cf.sh` fallback.
- Kept `scripts/cf.sh` behavior unchanged except for a recovery note, because wrapper fallback was not required for the standard `build:cloudflare` path.

## Evidence

- Spec source: `phase-02.md`
- Post-change dependency state: `outputs/phase-11/evidence/after-pnpm-why-esbuild.log`
- Platform binary scan: `outputs/phase-11/evidence/esbuild-versions.log`

