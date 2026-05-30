# Phase 2 — Design

## 1. コンポーネント設計

### 1.1 `MemberHeader` 編集後シグネチャ

```tsx
import { SignOutButton } from "../auth/SignOutButton";
import type { AuthView } from "../../lib/auth-view";

export interface MemberHeaderProps {
  readonly authView?: AuthView;
}

export function MemberHeader({ authView }: MemberHeaderProps = {}) {
  const isAdmin = authView?.kind === "admin";
  return (
    <header
      className="member-header"
      data-testid="member-header"
      data-auth-state={isAdmin ? "admin" : "member"}
    >
      <span className="brand" aria-label="UBM 兵庫">UBM 兵庫</span>
      <nav aria-label="member navigation">
        <a href="/profile">マイページ</a>
        <a href="/members">公開ページ</a>
        {isAdmin && (
          <a href="/admin" data-role="admin-cta" aria-label="管理ダッシュボードへ移動">
            管理
          </a>
        )}
      </nav>
      <SignOutButton />
    </header>
  );
}
```

### 1.2 `(member)/layout.tsx` 編集後構造

```tsx
import { MemberHeader } from "../../src/components/layout/MemberHeader";
import { getAuthView } from "../../src/lib/auth-view";

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const authView = await getAuthView();
  return (
    <div data-theme="warm" data-route-group="member" data-testid="member-shell">
      <header data-shell="topbar">
        <MemberHeader authView={authView} />
      </header>
      <main>{children}</main>
    </div>
  );
}
```

既存 `data-*` 属性 / className / wrapper 構造は変更しない。

## 2. 型契約

`AuthView`（`apps/web/src/lib/auth-view/types.ts` で定義）:

```ts
export type AuthView =
  | { kind: "guest" }
  | { kind: "member"; profileHref: string }
  | { kind: "admin"; profileHref: string; adminHref: string };

export function resolveAuthView(session: SessionLike | null | undefined): AuthView;
export function getAuthView(): Promise<AuthView>;
```

- `MemberHeader` 内では `adminHref` の存在は `kind === "admin"` の discriminated union で型保証。
- `guest` / 未指定は member header 上では fail-closed として `data-auth-state="member"` に正規化する。
- 本 spec では `adminHref` の値検証はしない（DOM では `href="/admin"` リテラルで描画。`authView.adminHref` 値はテスト用 fixture から渡る前提だが、現状コードはリテラルを採用）。

## 3. fail-closed 戦略

- `getAuthView()` は例外を `{ kind: "guest" }` に吸収する。
- `MemberHeader` 自体は `authView` 未指定でも `data-auth-state="member"` で描画（最小描画）し、admin リンクは出さない。

## 4. 入出力・副作用

| 関数 | input | output | 副作用 |
|------|-------|--------|--------|
| `MemberHeader` | `MemberHeaderProps`（`authView?: AuthView`） | JSX | なし（純関数） |
| `MemberLayout` (async) | `{ children }` | Promise<JSX> | `getAuthView()` 経由で auth.js session を 1 回読む |
| `resolveAuthView` | `SessionLike | null | undefined` | `AuthView` | なし（純関数） |
| `getAuthView` | なし | `Promise<AuthView>` | `getSession()` 経由で Auth.js session を読む |

## 5. プロトタイプ整合

`docs/00-getting-started-manual/claude-design-prototype/` の primitives / tokens / rhythm を変更しない。color literal は CSS class 経由のみ（HEX 直書き禁止）。
