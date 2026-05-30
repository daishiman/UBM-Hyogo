# Phase 1 — Requirements

## 1. 症状

`(member)/profile` の `MemberHeader` は現状 `SignOut` / マイページ / 公開ページ の 3 リンクのみで、管理者 session 保持時にも `/admin` への動線が表示されない。会員層から管理層への遷移が消失している。

## 2. 期待振る舞い

| state | header 要素 |
|-------|------------|
| `authView` 未指定 / `guest` / 取得失敗 | brand + マイページ + 公開ページ + SignOut（`data-auth-state="member"`） |
| `authView.kind === "member"` | 同上 |
| `authView.kind === "admin"` | 同上 + 「管理」リンク (`href="/admin"`, `data-role="admin-cta"`, `data-auth-state="admin"`) |

## 3. AC（受け入れ基準）

| ID | 入力 | 期待 |
|----|------|------|
| AC-E1 | `<MemberHeader />`（authView 未指定） | `data-auth-state="member"`、admin リンク不存在 |
| AC-E2 | `<MemberHeader authView={{ kind: "member", profileHref: "/profile" }} />` | `data-auth-state="member"`、admin リンク不存在 |
| AC-E3 | `<MemberHeader authView={{ kind: "admin", profileHref: "/profile", adminHref: "/admin" }} />` | `data-auth-state="admin"`、`data-role="admin-cta"` (`href="/admin"`) 存在 |
| AC-E4 | 全ケース | `SignOutButton`（`data-testid="sign-out-button"`）存在 |
| AC-E5 | 全ケース | brand / マイページ / 公開ページ 3 要素存在（regression） |
| AC-E6 | `(member)/layout.tsx` | async コンポーネントとして `getAuthView()` を呼び `<MemberHeader authView={authView} />` を描画 |
| AC-E7 | 既存属性 | `data-testid="member-header"`、`data-theme="warm"`、`data-route-group="member"`、`data-testid="member-shell"` を保持 |
| AC-E8 | `resolveAuthView()` | null / empty memberId は guest、memberId は member、isAdmin=true は admin に正規化 |

## 4. 非機能要件

- a11y: 「管理」リンクには `aria-label="管理ダッシュボードへ移動"` を付与
- テスタビリティ: `data-auth-state` / `data-role="admin-cta"` で Vitest / Playwright 判定可能
- SSR 整合: hydration mismatch を発生させない（layout server-side で `authView` 確定後 prop 配信）
- fail-closed: `getAuthView()` throw 時は `{ kind: "guest" }` に正規化し、`MemberHeader` は `data-auth-state="member"` で admin link を出さない

## 5. 前提条件

- `apps/web/src/lib/auth-view/` に `AuthView` 型、`resolveAuthView()`、`getAuthView()` を本 cycle で追加済み
- `getAuthView()` は `apps/web/src/lib/session.ts` の `getSession()` を利用し、`apps/web` から D1 へ直接接続しない

## 6. スコープ外

- `PublicHeader` 改修（親 workflow Task A）
- `AdminSidebar` 改修（親 workflow Task F）
- `/login` redirect（親 workflow Task D）
- middleware 変更
- Auth.js provider 変更
- 新 endpoint 追加 / D1 schema 変更
