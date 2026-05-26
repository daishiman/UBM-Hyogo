---
task: issue-917-alert-relay-runtime-fire-evidence
recorded: 2026-05-25
topics: [alert-relay, runtime-evidence, user-gated, sheets-auth-healthcheck, internal-subrequest, closed-issue, runtime-observation]
related-references:
  - references/workflow-issue-917-alert-relay-runtime-fire-evidence-artifact-inventory.md
  - references/task-workflow-active.md
  - docs/30-workflows/completed-tasks/issue-917-alert-relay-runtime-fire-evidence/
  - docs/30-workflows/completed-tasks/issue-857-internal-alert-relay-binding-wiring/
  - docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/
classification:
  - operations/runtime-evidence-boundary
  - security/receiver-contract-first
  - documentation/source-trigger-vs-receiver-smoke
  - governance/user-gated-runtime
---

# Lessons Learned — issue-917 Alert Relay Runtime Fire Evidence (2026-05)

## L-I917RUNTIME-001. Runtime tail is the only proof for silent no-op removal

`wrangler.toml` `[vars]` named environment non-inheritance can leave local tests green while staging/production still silently skip alert delivery. Config guard tests prove intended files, but Workers tail proves that `reason: "missing API_INTERNAL_BASE_URL or token"` has disappeared in the deployed runtime.

## L-I917RUNTIME-002. Receiver contract wins over issue text

When an issue proposes adding a new internal token but the receiver accepts only `CF_WEBHOOK_AUTH_SECRET`, do not add a second secret first. Preserve the receiver contract and use the existing fallback path until a deliberate multi-token receiver change is implemented.

## L-I917RUNTIME-003. Source-trigger evidence and receiver smoke are separate artifacts

`curl /internal/alert-relay` proves receiver behavior. `sheets-auth-healthcheck` controlled invalidation proves the source-trigger path. Store them in separate workflow/evidence files so a receiver smoke cannot be mistaken for cron-triggered alert delivery.

## L-I917RUNTIME-004. User-gated runtime evidence needs a spec root, not a hidden TODO

Runtime evidence often depends on deploy approval, secrets, and tail access. A local-observability workflow with Gate-D pending keeps the work trackable without claiming runtime PASS. Source unassigned tasks should receive a canonical workflow pointer, then be consumed only after the runtime evidence file exists.

## L-I917RUNTIME-005. Runtime evidence specs must be executable against actual log surface

If a workflow requires tail evidence such as `responseStatus`, the code must emit that field before the runtime cycle starts. A docs-only label is not sufficient when the evidence contract names a log event that does not exist. Add the smallest observability implementation and a focused contract test, then leave deploy/tail operations user-gated.
