# 2026-05-23 ci-green-recovery-smoke-coverage-shard

Registered `docs/30-workflows/ci-green-recovery-smoke-coverage-shard/` as
`implemented_local_evidence_captured / implementation / NON_VISUAL / runtime_ci_pending`.

The workflow implements a single cycle for three current CI failures:

- `runtime-smoke-staging / smoke` admin-list 401 caused by static 24h session JWT bearer expiry.
- `coverage-gate` misleading `MISSING` output caused by absent shard artifacts.
- `coverage-gate-shard (packages)` checkout authentication failure.

Same-wave sync:

- Added output `artifacts.json` mirror for root/output parity.
- Added aiworkflow artifact inventory.
- Added quick-reference, resource-map, task-workflow-active, SKILL history, and LOGS entries.
- Kept production auth specs unchanged because `mintStagingBearers` reuses existing session JWT primitives and is smoke infrastructure only.

Local implementation evidence is captured for code/CI changes, runbook edit,
mint parity, and smoke shell reason classification. Staging secret placement,
runtime CI evidence, commit, push, and PR remain user-gated.
