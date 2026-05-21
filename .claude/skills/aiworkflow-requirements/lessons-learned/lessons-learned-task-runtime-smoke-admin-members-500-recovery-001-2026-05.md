# Lessons Learned: task-runtime-smoke-admin-members-500-recovery-001

## L-RTSMOKE-001: Runtime smoke recovery needs body visibility before root fix selection

When a runtime smoke fails with `http=500` but the runner discards the response
body, the workflow tends to overfit to a guessed root cause. Preserve the first
bounded response body in the smoke log before selecting code, infra, or config
fixes.

5-minute resolution:

1. Keep Phase 2 as the RCA gate: direct API body, D1 schema snapshot, Workers tail.
2. Implement runner body visibility through the existing redaction filter in-cycle if the runner is in scope.
3. If local contract evidence already proves a defensive handler fix is needed, implement it in the same cycle and keep only staging proof user-gated.
4. Mark staging deploy and backend-ci rerun as user-gated evidence, not local PASS.
5. Register strict 7, artifact inventory, and aiworkflow indexes in the same wave.

## L-RTSMOKE-002: Create alert tasks only after signal shape and runtime evidence are stable

Alerting for a future code such as `UBM-ADMIN-MEMBERS-500` is useful after the
handler emits it. Once the handler exists, still require staging deploy/runtime
smoke evidence before creating alert IaC, so the task can specify signal
frequency, routing, and redaction boundaries from observed data rather than
local-only assumptions.
