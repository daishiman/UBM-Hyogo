# Phase 11 Manual Evidence Deferred

Status: runtime_screenshot_pending_user_gate

## Responsibility Split

Component evidence PASS is recorded in `outputs/phase-11/main.md` and `outputs/phase-11/test-log.md`.
Manual screenshot and runtime smoke evidence are deferred here and must not be treated as PASS until captured.

## Deferred Screenshot States

| State | URL / Preconditions | Expected Evidence Path |
| --- | --- | --- |
| authenticated active public profile | `/profile` with authenticated member whose `publishState=public` | `outputs/phase-11/profile-screenshot-desktop.png` |
| authenticated active public profile mobile | `/profile` with authenticated member whose `publishState=public`, mobile viewport | `outputs/phase-11/profile-screenshot-mobile.png` |
| member-only visibility | `/profile` with authenticated member whose `publishState=member_only` | `outputs/phase-11/profile-screenshot-member-only.png` |
| hidden visibility | `/profile` with authenticated member whose `publishState=hidden` | `outputs/phase-11/profile-screenshot-hidden.png` |
| pending visibility request | `/profile` with `pendingRequests.visibility` present | `outputs/phase-11/profile-screenshot-pending-visibility.png` |
| pending delete request | `/profile` with `pendingRequests.delete` present | `outputs/phase-11/profile-screenshot-pending-delete.png` |
| duplicate/conflict request error | submit when server returns `DUPLICATE_PENDING_REQUEST` | `outputs/phase-11/profile-screenshot-conflict-error.png` |

## Capture Gate

- G1: user approval for local/staging runtime evidence capture
- G2: authenticated fixture or staging account availability
- G3: Playwright/browser screenshot execution
- G4: commit / push / PR approval, separate from evidence capture

## Follow-up Write Locations

When executed, append fresh evidence to:

- `outputs/phase-11/staging-smoke-log.md`
- `outputs/phase-11/production-smoke-log.md`
- `outputs/phase-11/sentry-24h-observation.md`
- screenshot PNG paths listed above

No placeholder screenshot is considered evidence.
