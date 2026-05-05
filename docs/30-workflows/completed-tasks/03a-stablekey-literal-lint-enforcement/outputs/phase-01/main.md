# Phase 1 Output: Requirements

Status: COMPLETED (enforced_dry_run review baseline).

This output records the stableKey literal lint enforcement requirements from `phase-01.md`.

Canonical decisions:

- Final enforcement target: ESLint custom rule or equivalent static check that fails CI on unauthorized stableKey string literals.
- Release strategy: warning -> monitor -> error. The final `fully enforced` state is only claimed after error-mode CI gate evidence exists.
- Scope boundary: runtime guard, 03b explicit rollout, and stableKey value changes remain outside this workflow.

AC trace source: `index.md` AC-1 through AC-7.
