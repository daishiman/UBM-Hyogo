# Phase 2.4 — Error Handling Matrix

| 経路 | status | 挙動 | 副作用 |
| --- | --- | --- | --- |
| fetchAuthed | 200 | JSON 返却 | なし |
| fetchAuthed | 401 | `AuthRequiredError` throw | — |
| fetchAuthed | 403 | `FetchAuthedError(403, body)` throw | — |
| fetchAuthed | 5xx | `FetchAuthedError(status, body)` throw | — |
| fetchAuthed | network err | TypeError propagate | — |
| useAdminMutation | catch AuthRequiredError | `redirector(toLoginRedirect(currentPath()))` | location 遷移 |
| useAdminMutation | catch FetchAuthedError 403 | `toaster("権限がありません", "alert")` + `setError` | alert toast |
| useAdminMutation | catch FetchAuthedError other | `setError`; `onError?.()` | error state |
| useAdminMutation | catch generic Error | `setError`; `onError?.()` | error state |
| useAdminMutation | success | `toastMessage` 表示 (status); `onSuccess?.()`; `router.refresh()` | server state 再取得 |
| 共通 | trigger() 中 | `isLoading: true` | finally で false |
