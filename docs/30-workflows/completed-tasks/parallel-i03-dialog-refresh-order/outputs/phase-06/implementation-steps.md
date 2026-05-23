# Phase 06 Implementation Steps

実装済み:

- `VisibilityRequestDialog.tsx`: `useRouter()` を追加し、success path 先頭で `router.refresh()` を呼ぶ。
- `DeleteRequestDialog.tsx`: 同上。
- `VisibilityRequestDialog.tsx` / `DeleteRequestDialog.tsx`: `DUPLICATE_PENDING_REQUEST` branch でも `onSubmitted` 前に `router.refresh()` を呼ぶ。
- `RequestActionPanel.tsx`: `useRouter` import / hook / parent refresh を削除。

API surface と props は不変。
