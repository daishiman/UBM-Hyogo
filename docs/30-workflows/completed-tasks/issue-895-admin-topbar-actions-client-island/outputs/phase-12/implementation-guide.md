# Implementation Guide

## For a Junior Reader

The admin header already had an empty place for global buttons. This change puts the existing logout button into that place without turning the whole admin layout into a browser-only component.

## Technical Summary

- Add `apps/web/src/features/admin/components/_layout/AdminTopbarActions.tsx` as the small client island.
- Reuse `SignOutButton` for the MVP global action.
- Inject the island from `apps/web/app/(admin)/layout.tsx` with `<AdminTopbar actions={<AdminTopbarActions />} />`.
- Keep page-specific actions in `AdminPageHeader.actions`.
- Update `(admin)/layout.spec.tsx` so the actual layout proves the actions slot is no longer `aria-hidden`.

## Screenshot Reference

Not applicable: `visualEvidence=NON_VISUAL`. The visible element is an existing `SignOutButton`; layout/a11y DOM assertions are the canonical evidence for this task.
