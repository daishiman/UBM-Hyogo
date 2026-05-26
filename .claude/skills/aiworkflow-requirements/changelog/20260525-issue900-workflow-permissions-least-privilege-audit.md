# 2026-05-25 issue-900 workflow permissions least privilege audit

Issue #900 was synced as `implemented_local_evidence_captured / implementation / NON_VISUAL`.

## Changes

- Added top-level `permissions: contents: read` to 12 workflows that lacked a top-level permissions block.
- Preserved existing job-level write permissions.
- Added `scripts/verify-workflow-top-level-permissions.sh`.
- Added the verifier to `.github/workflows/ci.yml` after actionlint.
- Added Phase 11 local evidence (`manual-test-result.md`, `verify-script-output.txt`, `workflow-diff.txt`) and Phase 12 strict 7 outputs.
- Registered aiworkflow task-workflow, resource-map, quick-reference, deployment GHA current facts, and artifact inventory.

## User-Gated Boundary

Commit, push, PR creation, and remote CI observation remain user-gated.
