# Production Runtime Smoke Runbook: Attendance Provider

## Scope

Issue #572 verifies the Issue #371 attendanceProvider DI path on production with read-only GET requests only. It does not deploy, mutate D1, change GitHub issue state, or run write endpoints.

## Gates

| Gate | Requirement |
| --- | --- |
| G1 | `pnpm typecheck`, `pnpm lint`, focused API tests, and build pass locally |
| G2 | Redaction unit tests pass, including production cookie / Cloudflare / email / name patterns |
| G3 | User explicitly approves one production read-only smoke run |
| G4 | Phase 13 commit / push / PR approval is obtained separately |

## Preparation

```bash
cd <repo-root>
export PRODUCTION_API_URL="https://api.ubm-hyogo.workers.dev"
unset STAGING_API_URL
bash apps/api/scripts/runtime-smoke/run-smoke.sh --env production --readonly --dry-run
```

Abort if the dry-run host is staging, preview, localhost, or equal to `STAGING_API_URL`.

## Execution

Open a fresh terminal session, then run:

```bash
cd <repo-root>
bash apps/api/scripts/runtime-smoke/run-smoke.sh --env production --readonly
```

When prompted, paste the admin and member session cookies. The script uses `read -s`, writes only summary metrics, and unsets session variables on exit.

## Evidence

Phase 11 uses 9 NON_VISUAL evidence files. Keep raw responses out of git and retain only summary/log files:

- `outputs/phase-11/evidence/typecheck.log`
- `outputs/phase-11/evidence/lint.log`
- `outputs/phase-11/evidence/test.log`
- `outputs/phase-11/evidence/build.log`
- `outputs/phase-11/evidence/grep-gate.log`
- `outputs/phase-11/production-smoke-summary.md`
- `outputs/phase-11/redact-filter-zero-hit.log`
- `outputs/phase-11/wrangler-binding-diff.md`
- `outputs/phase-11/user-approval-evidence.md`

Do not store raw response bodies, cookies, Bearer tokens, email local parts, names, OAuth callback tokens, or Cloudflare cookie values.
