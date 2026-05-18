# Phase 7 Integration Plan

## Required Gates

| Gate | Scope |
| --- | --- |
| local dependency convergence | `pnpm why esbuild` and `pnpm exec esbuild --version` |
| local static verification | typecheck and lint |
| local build verification | API wrangler dry-run and web OpenNext build |
| GitHub Actions | `web-cd / deploy-staging` and `backend-ci / deploy-staging` after user-gated push |

## Build-Only CI Gate Decision

The repository already has PR build coverage through `.github/workflows/pr-build-test.yml` and `.github/workflows/ci.yml` for Cloudflare build paths. This cycle does not create a separate unassigned task. Instead, the esbuild convergence fix is verified against the existing build gates and the prior follow-up wording was removed from the close-out evidence.
