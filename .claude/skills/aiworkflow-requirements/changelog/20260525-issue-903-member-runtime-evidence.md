# 2026-05-25 issue-903 member runtime evidence

Synced `docs/30-workflows/completed-tasks/issue-903-parallel-03-followup-005-member-runtime-evidence/` as `implemented_local_evidence_captured / implementation / VISUAL`.

- Moved `/profile` from `apps/web/app/profile/` to `apps/web/app/(member)/profile/` so the existing member page inherits the `(member)` AppShell without changing the URL.
- Added `apps/web/playwright/tests/parallel-03-member-shell-scrape.spec.ts` and captured EV-13/EV-16 evidence for parent `parallel-03-appshell-layouts`.
- Updated static invariant path walkers, eslint override globs, and visual harness import drift.
- Updated parent `phase-11-evidence-inventory.md` EV-13 / EV-16 to `present`.
- Added artifact inventory `references/workflow-issue-903-parallel-03-followup-005-member-runtime-evidence-artifact-inventory.md`.
- Synced current profile physical paths in quick-reference, resource-map, task-workflow-active, profile-related artifact inventories, static invariant catalog, and state-management reference.

Commit, push, PR, and GitHub Issue mutation remain user-gated.
