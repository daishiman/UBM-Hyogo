# Phase 7 Output: AC マトリクス

## Status

SPEC_CREATED

## AC Summary

| AC | Evidence |
| --- | --- |
| AC1 no long-lived secret in deploy workflows | `outputs/phase-11/evidence/workflow/legacy-token-references-final.log` |
| AC2 lifetime <= 3600 seconds | `outputs/phase-11/evidence/lifetime/cf-token-lifetime.json` |
| AC3 staging and production OIDC deploy work independently | `workflow-run/staging-run-url.txt`, `workflow-run/production-run-url.txt` |
| AC4 old long-lived token revoked | `token-revoke/old-token-revoked.json` |
| AC5 rollback runbook exists | Phase 12 system spec summary + infrastructure runbook section |
| AC6 minimum 4 scope retained | `scope/cf-token-scope.json` |
| AC7 subject claim hardened | `audit-log/oidc-subject-claims.json` |
| AC8 OIDC and Cloudflare audit correlation exists | `audit-log/oidc-cf-audit-correlation.json` |
| AC9 7 consecutive staging greens | `staging/staging-7day-green.jsonl` |

