# 2026-05-31 issue-1029-public-member-photo-display spec sync

## Summary

Initial sync registered `docs/30-workflows/completed-tasks/issue-1029-public-member-photo-display/` as a spec-authored implementation workflow. The 2026-06-01 addendum below is the current close-out state.

2026-06-01 addendum: implementation close-out reclassified this workflow to `implemented_local_runtime_pending / implementation / VISUAL_ON_EXECUTION`. Local apps/packages implementation, focused tests/typecheck, public route contract, and local Playwright screenshots are now complete. Only R2 secrets, staging deploy, real R2 URL capture, commit, push, PR, and Issue mutation remain user-gated.

## Changes

- Added public exposure policy ADR `docs/00-getting-started-manual/specs/16-member-photo-public-exposure.md`.
- Registered the workflow in quick-reference, resource-map, task-workflow-active, and artifact inventory.
- Fixed the workflow references from non-existent `api-schema.md` / `security-pii-consent.md` to actual aiworkflow requirement files.
- Initial spec sync kept implementation and external operations gated. The 2026-06-01 close-out completed local implementation and local screenshots; only R2 secrets, staging deploy, real R2 URL capture, commit, push, PR, and Issue mutation remain user-gated.

## Boundary

Original 2026-05-31 sync was spec-only. 2026-06-01 implementation close-out added apps/packages implementation and promoted public `photoUrl` from planned optional contract to implemented local contract.
