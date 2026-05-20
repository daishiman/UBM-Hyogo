# Implementation Guide

## Part 1: Beginner Summary

When an error page appears, screen reader users need the page to announce the new error heading. Moving focus to the h1 makes that announcement reliable.

This task puts the focus-moving code in one hook. Each error page still owns its own message and retry button, but the focus behavior is shared.

`preventScroll: true` keeps the page from jumping when focus moves.

## Part 2: Technical Summary

The hook lives at `apps/web/src/lib/a11y/useAutoFocusOnMount.ts` and accepts `RefObject<T | null>`.

It runs a mount-only `useEffect` and calls `focus({ preventScroll: true })` when `ref.current` exists.

The API intentionally has no options parameter because error boundary focus should not opt out of scroll prevention in this workflow.

The original source follow-up proposed `options?: FocusOptions`, but this workflow narrows the API to the invariant required by error boundaries: always call `focus({ preventScroll: true })`. Logger and focus side effects are intentionally separate `useEffect` calls; no business behavior depends on their relative order.

## Part 3: Changed Files

Implementation changed the hook, three route error boundaries, root error wiring, and related tests.

Documentation changed the UI/a11y manual and workflow trace files.

Profile and admin boundaries also received the remaining root-equivalent hardening from their existing follow-ups: digest display, structured logger calls, production-safe user copy, and dev-only stack output.

No API, D1, environment, or visual token files were changed for behavior.

## Part 4: Usage Pattern

Create `const headingRef = useRef<HTMLHeadingElement>(null)`.

Call `useAutoFocusOnMount(headingRef)` in the component body.

Attach `ref={headingRef}` and `tabIndex={-1}` to the h1 inside the alert region.

## Part 5: Verification

Run the web package test command recorded in Phase 11.

Run typecheck and lint before PR handoff.

Run `pnpm verify:phase12-compliance` and `pnpm gate-metadata:validate` after artifact changes.

## Part 6: Known Boundaries

This is not a focus trap hook.

This does not return focus to a trigger.

This does not change route copy, visual layout, API calls, or database state.

## Part 7: Rollback

The rollback is local and mechanical: restore inline root focus behavior and remove hook usage from the added boundaries.

Because no backend or migration is involved, rollback does not require external state repair.

The source spec consumed marker may remain as historical trace if implementation is reverted in a later branch.

## Part 8: User-Gated Work

Commit, push, and PR creation are not executed in this cycle.

Runtime browser/screen-reader smoke can be added after user approval.

Issue mutation is unnecessary because Issue #799 is already closed; PR wording uses `Refs #799`.

## Part 9: Skill Compliance

Phase 12 strict 7 files are present.

Gate metadata is attached to root and output artifacts.

The compliance check uses canonical headings and Phase 11 evidence inventory with `Classification / Path / Status`.
