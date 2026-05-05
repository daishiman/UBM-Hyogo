# Phase 5 Output: Second-Stage Apply Runbook

## Preflight

1. Confirm UT-GOV-001 first-stage protection is applied.
2. Confirm UT-GOV-004 contexts are still current.
3. Confirm open PR check-runs are healthy enough to avoid admin block.
4. Confirm rollback payloads are immediately available.
5. Confirm explicit user approval before Phase 13 real PUT.

## Execution Boundary

This runbook is executable only inside Phase 13 after user approval. It defines the steps but does not authorize automatic execution.

## Sequence

1. GET current protection for `dev` and `main`.
2. Generate branch-specific payloads from current GET plus expected contexts.
3. PUT `dev`, then verify with GET.
4. PUT `main`, then verify with GET.
5. Record drift check and change summary.
