# 2026-05-27 admin-requests-prototype-alignment-and-404-fix sync

## Summary

Registered `docs/30-workflows/completed-tasks/admin-requests-prototype-alignment-and-404-fix/`
as `implemented_local_evidence_captured / implementation / VISUAL / staging runtime pending_user_approval`.

## Changes

- Added Phase 12 strict 7 physical documentation outputs to the workflow root.
- Added local API/Web implementation and focused regression coverage.
- Added local authenticated Playwright screenshot evidence for `/admin/requests`.
- Added artifact inventory:
  `references/workflow-admin-requests-prototype-alignment-and-404-fix-artifact-inventory.md`.
- Updated `indexes/resource-map.md`, `indexes/quick-reference.md`, and
  `references/task-workflow-active.md` with the active workflow entry.
- Kept staging deploy, staging curl 200, staging visual baseline, commit, push,
  and PR user-gated.

## Lessons Learned

L-ADMREQ-001..005 を `lessons-learned/lessons-learned-admin-requests-prototype-alignment-and-404-fix-2026-05.md` に追加。要点:

- worker entry mount drift gate (`*.mount.spec.ts` + `worker.fetch`)
- Phase 11 evidence status enum は `present|pending|n/a` のみ (compliance check 修正)
- route page h1 所有 + panel hidden h2/aria-labelledby
- `ADMIN_REQUESTS_EVIDENCE=1` + `PLAYWRIGHT_EVIDENCE_DIR` で local screenshot を env-gated 起動
- dual-task サイクルでの `cmp` artifacts.json mirror gate

## Boundary

This sync records local implementation completion. External staging runtime
verification and PR publication remain user-gated.
