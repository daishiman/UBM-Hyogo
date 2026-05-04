# Phase 11 Cloudflare CLI NON_VISUAL Evidence

## Applicability

Use this subtemplate for `taskType=implementation` and `visualEvidence=NON_VISUAL` workflows whose Phase 11 verifies a Cloudflare CLI auth or shell wrapper path rather than a UI route.

Typical examples:

- `bash scripts/cf.sh whoami` authentication recovery
- `bash scripts/cf.sh tail` transport preflight
- D1 / Pages / Workers command wrapper validation where no UI changed

## Required Outputs

| file | purpose |
| --- | --- |
| `outputs/phase-11/main.md` | final Phase 11 state and AC table |
| `outputs/phase-11/manual-smoke-log.md` | executed command table; must not remain `not_run` after execution |
| `outputs/phase-11/link-checklist.md` | links to evidence files and parent handoff |
| `outputs/phase-11/whoami-exit-code.log` or command-specific exit log | exit code only |
| `outputs/phase-11/redaction-checklist.md` | secret / PII leak check |
| command-specific stage isolation file | op / mise / wrangler or equivalent wrapper layer result |
| `outputs/phase-11/handoff-to-parent.md` | required when this workflow unblocks a parent runtime workflow |

## Runtime State Sync

When Phase 11 changes from planned evidence to executed evidence, update the same wave:

- root `artifacts.json`
- `outputs/artifacts.json`
- Phase 11 helper files
- `outputs/phase-12/phase12-task-spec-compliance-check.md`
- `outputs/phase-12/system-spec-update-summary.md`
- relevant `aiworkflow-requirements` index / task workflow rows

Leaving helper files in `PENDING_RUNTIME_EVIDENCE` after `main.md` says PASS is a close-out failure.

## Scope Boundary

`whoami` exit 0 proves the auth path is usable for identity lookup. It does not by itself prove deploy, D1, Pages, or tail scopes. Scope files must distinguish runtime identity evidence from user-confirmed dashboard scope evidence.
