# PR Body Draft

Status: `draft_pending_implementation`

## Summary

- Add `useConfirmDialog` hook and `ConfirmDialog` UI component.
- Route destructive admin meetings actions through confirm dialog.
- Replace direct `fetch` in `MeetingAttendancePanel` with `useAdminMutation`.

## Test Plan

- [ ] `mise exec -- pnpm typecheck`
- [ ] `mise exec -- pnpm lint`
- [ ] `bash scripts/verify-pr-ready.sh`
- [ ] Phase 11 visual evidence captured
