# 2026-06-01 issue-1029 public member photo display implementation close-out

## Summary

Reclassified `docs/30-workflows/completed-tasks/issue-1029-public-member-photo-display/` from spec-created planning to `implemented_local_runtime_pending / implementation / VISUAL_ON_EXECUTION` after local implementation and evidence were captured.

## Changed

- Updated public member API contract wording in `references/api-endpoints.md`: optional `photoUrl` is implemented for list/profile, not planned.
- Updated `indexes/resource-map.md` to point to implemented local targets and the new lessons file.
- Added implementation lessons for upstream #983 anchor reuse, optional resolver DI, and local visual evidence vs real R2 URL Gate-C separation.
- Promoted Phase 12 workflow feedback to `task-specification-creator/references/patterns-phase12-sync.md`.

## User-gated boundary

R2 secrets, staging deploy, real R2 URL capture, commit, push, PR, and Issue mutation remain user-gated.
