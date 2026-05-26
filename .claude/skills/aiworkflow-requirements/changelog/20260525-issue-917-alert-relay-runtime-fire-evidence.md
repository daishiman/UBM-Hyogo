# 2026-05-25 issue-917 alert relay runtime fire evidence

Registered `docs/30-workflows/completed-tasks/issue-917-alert-relay-runtime-fire-evidence/` as `implemented_local_evidence_captured / implementation / NON_VISUAL / runtime_observation`.

The workflow formalizes user-gated staging runtime evidence for the `sheets-auth-healthcheck` → `/internal/alert-relay` path after issue-857 wired `API_INTERNAL_BASE_URL`. This cycle also adds minimal runtime observability in `apps/api/src/scheduled/sheets-auth-healthcheck.ts` so `event: "sheets.auth.alert_relay_post"` records `responseStatus`, with focused contract coverage in `sheets-auth-healthcheck.contract.spec.ts`.

Synchronized quick-reference, resource-map, task-workflow-active, artifact inventory, lessons learned, and LOGS. Source `docs/30-workflows/unassigned-task/UT-25-DERIV-02-FU-02-alert-relay-runtime-fire-evidence.md` remains unconsumed until runtime evidence is captured, but now points to the canonical workflow.

Cloudflare secret list, staging deploy/tail, controlled SA key invalidation, runtime evidence MD creation, issue-857 back-reference update, source consumed conversion, commit, push, and PR remain user-gated.
