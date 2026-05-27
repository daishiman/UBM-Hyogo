# Phase 11 — Manual Test Checklist

## Local Gates

| ID | Command | Expected | Status |
| -- | ------- | -------- | ------ |
| L-01 | `bash scripts/verify-no-process-env-internal-api.sh` | no direct `process.env.INTERNAL_API_BASE_URL` production references | passed locally |
| L-02 | focused web Vitest route/helper specs | all pass | passed locally |
| L-03 | prototype HTTP server MIME smoke | `.jsx` served as `application/javascript` | passed locally |

## Runtime / Visual Gates

| ID | Target | Evidence | Status |
| -- | ------ | -------- | ------ |
| V-01 | `/login` input/button balance | `screenshots/login-balanced.png` | captured locally; staging pending |
| V-02 | Google brand icon | `screenshots/google-brand-icon.png` | captured locally; staging pending |
| R-01 | staging magic-link POST | redacted curl output | user-gated runtime pending |
| P-01 | prototype browser render | `screenshots/prototype-rendered.png` | captured locally |

## Acceptance Boundary

Local implementation now has screenshot evidence. Staging runtime PASS must not be claimed until staging `/login` visual capture and staging magic-link POST evidence are added.
