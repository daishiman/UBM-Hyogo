# Phase 11 Main — admin members prototype redesign

## Verdict

Local visual and focused component evidence captured.

| Gate | Result |
| --- | --- |
| focused Vitest | PASS: 7 files / 25 tests |
| web typecheck | PASS: `pnpm --filter @ubm-hyogo/web typecheck` |
| local visual screenshots | PASS: 16 PNG |
| staging deploy / authenticated staging visual | pending_user_approval |

## Visual Evidence

`outputs/phase-11/screenshots/` contains 16 PNG files:

- states: `loaded`, `empty`, `published`, `hidden`
- viewports: `mobile` 390x844, `tablet` 834x1112, `laptop` 1280x800, `desktop` 1440x900

Inventory: `outputs/phase-11/screenshot-inventory.json`.

## Review Findings Closed In This Cycle

- `MemberPublishSwitch` now accepts the current API response shape (`status.publish_state`) and syncs local state when the parent prop changes.
- Mobile admin shell no longer lets the sidebar keep `min-height: 100vh` in the single-column layout.

## Boundary

Commit, push, PR, staging deploy, and authenticated staging screenshots remain user-gated.
