# Documentation Changelog

| Date | Path | Change |
| --- | --- | --- |
| 2026-05-16 | `scripts/ci/verify-env-secrets.sh` | Added env/repo secret-name preflight checker |
| 2026-05-16 | `scripts/ci/__tests__/verify-env-secrets.spec.sh` | Added fixture shell tests for resolved, missing, repo fallback, allowlist, built-in, and disabled-job cases |
| 2026-05-16 | `.github/workflows/verify-env-secrets.yml` | Added PR/push/workflow_dispatch preflight gate without path narrowing |
| 2026-05-16 | `.github/workflows/d1-migration-verify.yml` | Replaced `CLOUDFLARE_API_TOKEN_STAGING` with `CLOUDFLARE_API_TOKEN` under `environment: staging` |
| 2026-05-16 | `.github/workflows/cloudflare-analytics-export.yml` | Moved Cloudflare account/zone identifiers from `secrets.*` to `vars.*` |
| 2026-05-16 | `docs/30-workflows/ci-env-secret-inventory-and-preflight-gate/**` | Added artifacts, task runbook, inventory, Phase 11 runtime boundary, and Phase 12 strict 7 |
| 2026-05-16 | `.claude/skills/aiworkflow-requirements/**` | Registered active workflow and deployment/secret-management references |

## Verification Log

| Command | Exit | Evidence |
| --- | ---: | --- |
| `bash scripts/ci/__tests__/verify-env-secrets.spec.sh` | 0 | `../phase-11/evidence/verify-env-secrets-test.txt` |
| `bash -n scripts/ci/verify-env-secrets.sh scripts/ci/__tests__/verify-env-secrets.spec.sh` | 0 | `../phase-11/evidence/bash-syntax.txt` |
| `actionlint` focused workflow set | 0 | `../phase-11/evidence/actionlint.txt` |
