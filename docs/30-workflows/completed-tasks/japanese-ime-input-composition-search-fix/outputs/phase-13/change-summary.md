# Phase 13 Change Summary

- Added `useImeSafeInput` for IME composition guarding, debounce commit, timer cleanup, external value sync, and immediate clear.
- Updated `Search` to use the hook and keep the clear button as the canonical keyword clear path.
- Added `Input.imeSafe` opt-in without changing default behavior.
- Removed keyword `q` chip from `SelectedFiltersBar`; zone/status/tag chips remain.
- Synced workflow and aiworkflow requirement ledgers.
