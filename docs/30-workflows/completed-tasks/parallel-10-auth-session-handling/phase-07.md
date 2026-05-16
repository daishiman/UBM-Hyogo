# Phase 7 — テスト計画

## メタ情報

| 項目 | 内容 |
| --- | --- |
| Workflow | parallel-10-auth-session-handling |
| Phase | 07 |
| Status | spec_created |

## 目的

この Phase の目的は、下記の詳細仕様に従って `parallel-10-auth-session-handling` を spec_created から実装可能な状態へ進めることである。

## 実行タスク

- [ ] 下記の Phase 固有手順を実行する。
- [ ] 成果物と evidence path を確認する。

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| workflow index | docs/30-workflows/parallel-10-auth-session-handling/index.md | 全体仕様 |
| artifacts | docs/30-workflows/parallel-10-auth-session-handling/artifacts.json | 状態台帳 |

## 成果物

| 成果物 | パス | 内容 |
| --- | --- | --- |
| Phase output | docs/30-workflows/parallel-10-auth-session-handling/outputs/phase-07/ | Phase成果物 |


## 単体テスト

### fetchAuthed (`apps/web/src/lib/fetch/authed.spec.ts`)

- [ ] 200 → JSON 返却
- [ ] 401 → `AuthRequiredError` throw
- [ ] 403 → `FetchAuthedError(403, body)` throw
- [ ] 500 → `FetchAuthedError(500, body)` throw
- [ ] network error → propagate

### normalizeRedirectPath (`apps/web/src/lib/url/safe-redirect.spec.ts` or `__tests__`)

- [ ] `"/admin"` → `"/admin"`
- [ ] `"//evil.com"` → `"/profile"`
- [ ] `"http://evil.com"` → `"/profile"`
- [ ] `"/admin\\..\\evil"` → `"/profile"`
- [ ] undefined → `"/profile"`

### toLoginRedirect (`apps/web/src/lib/url/login-redirect.spec.ts`)

- [ ] `/profile` → `/login?redirect=%2Fprofile`
- [ ] `//evil.com` → `/login?redirect=%2Fprofile`（fallback 経由 encode）

### Toast (`apps/web/src/components/ui/Toast.spec.tsx`)

- [ ] `toast("hello")` → `[role="status"]` に描画
- [ ] `toast("warn", "alert")` → `[role="alert"]` に描画
- [ ] 3 秒経過後に消える（fake timers）

### useAdminMutation (`apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.tsx`)

Phase 6 Step 5 の 6 ケース。

## 統合テスト

本サイクルでは新規 e2e は追加しない。既存 Playwright の `/admin` 系シナリオで session 切れ→`/login` redirect が観測されるか目視確認のみ（CI gate には含めない）。

## 実行コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test
```

## 完了条件

- `outputs/phase-07/test-plan.md` に上記チェックリストが転記され、Phase 9 受入で reuse できる粒度であること。
