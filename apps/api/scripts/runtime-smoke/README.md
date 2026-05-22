# Attendance Runtime Smoke

`run-smoke.sh` is the user-gated, read-only smoke entrypoint for Issue #572.

- Production requires `PRODUCTION_API_URL` and `--readonly`.
- Staging rehearsal uses `--env staging` with `STAGING_API_URL`.
- `--dry-run` validates URL selection and redaction plumbing without a session or network calls.
- Real production execution reads missing session cookies with `read -s` and unsets them on exit.
- Evidence is summary-only under `docs/30-workflows/issue-572-attendance-provider-production-runtime-smoke/outputs/phase-11/`.
- `run-production-smoke.sh` remains only as a compatibility wrapper around `run-smoke.sh --env production`.
