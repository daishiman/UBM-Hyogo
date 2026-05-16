# Phase 7 — Test Plan

## 単体テスト

### fetchAuthed (`apps/web/src/lib/fetch/authed.spec.ts`) — 既存

- [x] 200 → JSON 返却
- [x] 401 → `AuthRequiredError` throw
- [x] 403 → `FetchAuthedError(403, body)` throw
- [x] 500 → `FetchAuthedError(500, body)` throw
- [x] network error → propagate

### toLoginRedirect / normalizeRedirectPath (`apps/web/src/lib/url/login-redirect.spec.ts`) — 既存

- [x] `/profile` → `/login?redirect=%2Fprofile`
- [x] ネスト path encode
- [x] `https://evil.example` → fallback
- [x] `//evil.example/x` → fallback
- [x] backslash 含み → fallback

### Toast (`apps/web/src/components/ui/Toast.spec.tsx`) — 新規

- [x] default variant → `role="status"` に描画
- [x] `variant="alert"` → `role="alert"` に描画
- [x] 3 秒経過後に消える (fake timers)

### useAdminMutation (`apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.tsx`) — 新規

- [x] 正常系 (router.refresh + onSuccess)
- [x] 401 → redirector mock 呼出
- [x] 403 → toaster mock("権限がありません", "alert") + error
- [x] 500 → error のみ
- [x] 汎用 Error → error + onError
- [x] reset() → error=null

## 統合テスト

本サイクル e2e 追加なし。既存 Playwright `/admin` 系シナリオで session 切れ→`/login` redirect は手動観測のみ。

## 実行コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test
mise exec -- pnpm --filter @ubm-hyogo/web build
```
