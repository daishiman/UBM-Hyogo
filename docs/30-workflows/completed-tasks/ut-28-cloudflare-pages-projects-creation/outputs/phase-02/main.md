# Phase 2 Output: 設計

## Status

completed

## Summary

The design fixes five lanes: upstream verification, OpenNext deployment-form decision, production project creation, staging project creation, and post-create verification. Commands are specified through `bash scripts/cf.sh`; bare `wrangler` execution is prohibited.

## GO Conditions

- `web-cd.yml` project-name expression matches `CLOUDFLARE_PAGES_PROJECT` plus `-staging`.
- `apps/api/wrangler.toml` compatibility date remains the source of truth.
- OpenNext deployment form is checked before create. If `pages_build_output_dir = ".next"` conflicts with the canonical OpenNext Workers form, real apply is NO-GO until UT-05 resolves the deployment form or explicitly records a Pages-form exception.

