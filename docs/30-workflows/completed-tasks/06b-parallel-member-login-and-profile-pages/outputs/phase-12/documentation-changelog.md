# documentation changelog

| 日付 | 変更 | 影響範囲 |
| --- | --- | --- |
| 2026-04-26 | 06b 仕様書 13 phase 完成 | application-implementation Wave 6 |
| 2026-04-26 | `/login` URL contract（state / email / redirect）を確定 | apps/web |
| 2026-04-26 | `/profile` を read-only として確定（編集 UI なし） | apps/web、不変条件 #4 / #11 |
| 2026-04-26 | `/no-access` 不採用を再宣言（不変条件 #9） | apps/web |
| 2026-04-26 | URL query 正本（不変条件 #8）を Magic Link 状態管理にも適用 | apps/web |

## 新規 path

- `apps/web/app/login/`
- `apps/web/app/profile/`
- `apps/web/middleware.ts`
- `apps/web/src/lib/fetch/authed.ts`
- `apps/web/src/lib/auth/{magic-link-client,oauth-client}.ts`
- `apps/web/src/lib/url/{login-query,login-redirect,login-state,safe-redirect}.ts`

## 新規 type / schema

- `loginQuerySchema`（zod）
- `AuthGateState`（5 状態 union、05b で定義）
- `MeView` / `MemberProfile`（04b で定義、本タスクは consumer）
