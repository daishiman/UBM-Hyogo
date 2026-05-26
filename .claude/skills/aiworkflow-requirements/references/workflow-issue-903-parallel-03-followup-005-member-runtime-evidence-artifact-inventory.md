# Workflow Artifact Inventory: issue-903 parallel-03 followup-005 member runtime evidence

Date: 2026-05-25

## Workflow

| Artifact | Path |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-903-parallel-03-followup-005-member-runtime-evidence/` |
| metadata | `docs/30-workflows/completed-tasks/issue-903-parallel-03-followup-005-member-runtime-evidence/artifacts.json` |
| Phase 11 evidence inventory | `docs/30-workflows/completed-tasks/issue-903-parallel-03-followup-005-member-runtime-evidence/phase-11-evidence-inventory.md` |
| Phase 12 strict 7 | `docs/30-workflows/completed-tasks/issue-903-parallel-03-followup-005-member-runtime-evidence/outputs/phase-12/` |

## Code

| Artifact | Path |
| --- | --- |
| moved profile route | `apps/web/app/(member)/profile/` |
| stale route removed | `apps/web/app/profile/` |
| profile invariant path update | `apps/web/src/__tests__/static-invariants.runtime.spec.ts` |
| profile eslint override update | `apps/web/eslint.config.mjs` |
| visual harness loading import | `apps/web/app/visual-harness/[name]/page.tsx` |
| member runtime scrape spec | `apps/web/playwright/tests/parallel-03-member-shell-scrape.spec.ts` |

## Evidence

| Artifact | Path |
| --- | --- |
| typecheck log | `docs/30-workflows/completed-tasks/issue-903-parallel-03-followup-005-member-runtime-evidence/outputs/phase-11/typecheck.log` |
| lint log | `docs/30-workflows/completed-tasks/issue-903-parallel-03-followup-005-member-runtime-evidence/outputs/phase-11/lint.log` |
| profile unit log | `docs/30-workflows/completed-tasks/issue-903-parallel-03-followup-005-member-runtime-evidence/outputs/phase-11/profile-unit.log` |
| Playwright scrape log | `docs/30-workflows/completed-tasks/issue-903-parallel-03-followup-005-member-runtime-evidence/outputs/phase-11/playwright-member-scrape.log` |
| sub-workflow DOM scrape | `docs/30-workflows/completed-tasks/issue-903-parallel-03-followup-005-member-runtime-evidence/outputs/phase-11/dom-scrape-member.txt` |
| sub-workflow screenshot | `docs/30-workflows/completed-tasks/issue-903-parallel-03-followup-005-member-runtime-evidence/outputs/phase-11/screenshots/member-shell.png` |
| parent DOM scrape | `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/outputs/phase-11/dom-scrape-member.txt` |
| parent screenshot | `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/outputs/phase-11/screenshots/member-shell.png` |
| parent ledger diff | `docs/30-workflows/completed-tasks/issue-903-parallel-03-followup-005-member-runtime-evidence/outputs/phase-11/parent-ledger-ev13-ev16-diff.txt` |

## Boundary

Commit, push, PR creation, and GitHub Issue mutation remain user-gated. No API endpoint, D1 schema, Auth.js middleware, or Cloudflare runtime mutation was introduced.
