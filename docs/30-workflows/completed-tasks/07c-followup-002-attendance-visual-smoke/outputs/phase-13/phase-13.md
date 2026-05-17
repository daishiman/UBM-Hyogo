# Phase 13: review and PR boundary

[実装区分: 実装仕様書]

## PR metadata

| Item | Value |
| --- | --- |
| base branch | `dev` |
| branch | current worktree branch |
| classification | implementation + workflow/spec sync |
| related issue | `Refs #313` |
| user gate | commit / push / PR |

## PR title draft

```text
test(issue-313): add attendance visual smoke coverage
```

## PR body draft

```markdown
## Summary

- implement attendance visual smoke coverage for AC-1 through AC-4
- align detail attendance mutation to existing `/admin/meetings/:id/attendances` POST contract
- add standalone mock meetings seed/endpoints and Phase 12 strict workflow evidence

## Evidence

- `pnpm --filter @ubm-hyogo/web exec tsc --noEmit --pretty false`
- `PLAYWRIGHT_EVIDENCE_TASK=07c-followup-002 pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/attendance.spec.ts --project=desktop-chromium`
- `pnpm exec tsx scripts/verify-phase12-compliance.ts`

Refs #313
```

## Screenshot references

Add these only after files exist under `outputs/phase-11/screenshots/`:

| AC | screenshot |
| --- | --- |
| AC-1 | `docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/phase-11/screenshots/attendance-deleted-excluded.png` |
| AC-2 | `docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/phase-11/screenshots/attendance-already-registered.png` |
| AC-3 | `docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/phase-11/screenshots/attendance-dup-1.png`, `attendance-dup-2.png` |
| AC-4 | `docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/phase-11/screenshots/attendance-delete-before.png`, `attendance-delete-after.png` |

## Prohibited actions in this turn

- Do not commit.
- Do not push.
- Do not create a PR.
- Do not mutate Issue #313.
