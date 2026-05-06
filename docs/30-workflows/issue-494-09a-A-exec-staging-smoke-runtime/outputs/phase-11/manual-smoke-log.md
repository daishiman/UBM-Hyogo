# Manual smoke log

Status: runtime_pending_user_approval

No staging mutation has been executed in this review cycle. This file is the required Phase 11 smoke log placeholder and must be updated only after the relevant G1-G3 approval gate is granted.

| Gate | Runtime action | Status | Evidence |
| --- | --- | --- | --- |
| Preflight | `bash scripts/cf.sh whoami` | pending | `outputs/phase-11/evidence/preflight/cf-whoami.log` |
| G1 | API/Web staging deploy | pending_user_approval | `outputs/phase-11/evidence/deploy/` |
| G2 | D1 list/parity/apply-if-needed | pending_user_approval | `outputs/phase-11/evidence/d1/` |
| G3 | Forms schema/responses sync | pending_user_approval | `outputs/phase-11/evidence/forms/` |
| Visual smoke | Playwright + screenshots | pending_after_G3 | `outputs/phase-11/evidence/playwright/`, `outputs/phase-11/evidence/screenshots/` |
| Tail | redacted wrangler tail | pending_after_G3 | `outputs/phase-11/evidence/wrangler-tail/api-30min.log` |
