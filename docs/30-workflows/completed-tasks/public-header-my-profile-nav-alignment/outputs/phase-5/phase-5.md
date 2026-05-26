# Phase 5: 実装（diff check）

## メタ情報

| 項目   | 値                                                |
| ------ | ------------------------------------------------- |
| Phase  | 5 / 13（実装 / verify_existing → diff check）     |
| 依存   | Phase 4                                           |
| 成果物 | outputs/phase-5/phase-5.md                        |

## 目的

`implementation_mode: "verify_existing"` のため、`git diff` による差分確認を主作業とし、AC-1〜AC-5 が
実コードで満たされていることを確認する。

## 実行タスク

- [x] 変更ファイル一覧を `git status` / `git diff --stat` で固定する
- [x] 主要差分を要点化する（`PublicHeader` / `SessionAwarePublicHeader` / `(public)/layout.tsx` / `app/page.tsx`）
- [x] focused vitest を実行し PASS を確認する
- [x] `pnpm typecheck` を実行し PASS を確認する

## 変更ファイル一覧

```
 M apps/web/app/(public)/layout.spec.tsx              | 10 +++++-
 M apps/web/app/(public)/layout.tsx                   |  6 ++--
 M apps/web/app/page.tsx                              |  4 +--
 M apps/web/src/components/public/PublicHeader.tsx    | 37 +++++++++++++++++++---
 M apps/web/src/components/public/__tests__/PublicHeader.spec.tsx | 31 ++++++++++++++++++
?? apps/web/src/components/public/SessionAwarePublicHeader.tsx
```

## diff 要点

### `PublicHeader.tsx`（modify）

- `export interface PublicHeaderCurrentUser { readonly memberId: string; readonly name?: string }` を新設
- `PublicHeaderProps` に `currentUser?: PublicHeaderCurrentUser | null` を追加
- `isAuthenticated = Boolean(currentUser)` で nav 末尾の `/profile` リンク（`data-role="my-profile"`）と
  右上 `auth-cta` の `href` / `data-state` を分岐

### `SessionAwarePublicHeader.tsx`（new）

```tsx
import { PublicHeader, type PublicHeaderProps } from "./PublicHeader";
import { getSession } from "../../lib/session";

export type SessionAwarePublicHeaderProps = Omit<PublicHeaderProps, "currentUser">;

export async function SessionAwarePublicHeader(
  props: SessionAwarePublicHeaderProps = {},
) {
  const session = await getSession();
  const currentUser = session
    ? { memberId: session.memberId, ...(session.name ? { name: session.name } : {}) }
    : null;
  return <PublicHeader {...props} currentUser={currentUser} />;
}
```

### `(public)/layout.tsx`

- `<PublicHeader />` → `<SessionAwarePublicHeader />`

### `app/page.tsx`

- HomePage は `(public)` group 外のため個別に同じ置換を実施

### `PublicHeader.spec.tsx`

- Phase 4 で設計した 3 ケース（anon CTA / auth CTA / `aria-current` on `/profile`）を追加

### `(public)/layout.spec.tsx`

- 冒頭で `vi.mock("../../src/components/public/SessionAwarePublicHeader", ...)` を宣言し、async wrapper を
  sync な `<div data-testid="session-aware-public-header-mock" />` に差し替え

## 検証実績

- `pnpm typecheck`: PASS（`tasks/bsvwc4252.output` — tsc --noEmit 0 件）
- `(public)/layout.spec.tsx`: 3/3 PASS（`tasks/b3yf29ay0.output` — Tests 3 passed）
- `PublicHeader.spec.tsx`: 5/5 PASS（targeted run で確認）

## 参照資料

- `outputs/phase-4/phase-4.md`
- `apps/web/src/lib/session.ts`

## 成果物

- `outputs/phase-5/phase-5.md`（本書）

## 完了条件

- [x] AC-1〜AC-5 が実コードで満たされている
- [x] focused vitest 10/10 PASS
- [x] typecheck PASS
