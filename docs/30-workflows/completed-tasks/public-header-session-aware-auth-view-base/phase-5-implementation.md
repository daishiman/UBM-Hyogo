# Phase 5 — 実装手順（TDD GREEN）

## 1. 実装順序

1. `apps/web/src/lib/auth-view/types.ts` 新規作成
2. `apps/web/src/lib/auth-view/resolveAuthView.ts` 新規作成 → `vitest run resolveAuthView.spec.ts` で 4 ケース PASS 確認
3. `apps/web/src/lib/auth-view/getAuthView.ts` 新規作成
4. `apps/web/src/lib/auth-view/index.ts` 新規作成（barrel）
5. `apps/web/src/components/public/PublicHeader.tsx` を async server component 化
6. `apps/web/src/components/public/__tests__/PublicHeader.spec.tsx` を `await PublicHeader(props)` 形式へ書き換え
7. `apps/web/app/(public)/layout.tsx` を async 化、`<PublicHeader authView />` で配信

## 2. 各ファイル実装ガイド

### 2.1 `types.ts`

```ts
export type AuthView =
  | { readonly kind: "guest" }
  | { readonly kind: "member"; readonly profileHref: "/profile" }
  | { readonly kind: "admin"; readonly profileHref: "/profile"; readonly adminHref: "/admin" };

export interface SessionLike {
  readonly user?: {
    readonly memberId?: string | null;
    readonly isAdmin?: boolean | null;
  } | null;
}
```

### 2.2 `resolveAuthView.ts`

```ts
import type { AuthView, SessionLike } from "./types";

export function resolveAuthView(session: SessionLike | null | undefined): AuthView {
  const memberId = session?.user?.memberId;
  if (typeof memberId !== "string" || memberId.length === 0) {
    return { kind: "guest" };
  }
  if (session?.user?.isAdmin === true) {
    return { kind: "admin", profileHref: "/profile", adminHref: "/admin" };
  }
  return { kind: "member", profileHref: "/profile" };
}
```

### 2.3 `getAuthView.ts`

```ts
import { getAuth } from "@/src/auth"; // 既存 Auth.js wrapper のパスは実装時に grep 確認
import { resolveAuthView } from "./resolveAuthView";
import type { AuthView, SessionLike } from "./types";

export async function getAuthView(): Promise<AuthView> {
  try {
    const session = (await getAuth().auth()) as SessionLike | null;
    return resolveAuthView(session);
  } catch {
    return { kind: "guest" };
  }
}
```

> **着手前 grep**: `rg "export.*getAuth" apps/web/src` で Auth.js wrapper の正本 import path を確定する。

### 2.4 `index.ts`

```ts
export type { AuthView, SessionLike } from "./types";
export { resolveAuthView } from "./resolveAuthView";
export { getAuthView } from "./getAuthView";
```

### 2.5 `PublicHeader.tsx`

- 関数を `export async function PublicHeader(props?: PublicHeaderProps)` へ変更。
- `const authView = props?.authView ?? (await getAuthView());`
- `<header data-auth-state={authView.kind} ...>` を必ず付与。
- AuthSlot 分岐は Phase 2 §5 の契約に従う。
- 既存 brand / nav / `aria-current` ロジックは保持。
- HEX 直書きは追加しない（`apps/web/src/styles/tokens.css` を経由）。

### 2.6 `(public)/layout.tsx`

```tsx
import { getAuthView } from "@/src/lib/auth-view";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const authView = await getAuthView();
  return (
    <div data-theme="warm" data-route-group="public" data-testid="public-shell">
      <header data-shell="topbar"><PublicHeader authView={authView} /></header>
      <main data-route="public">{children}</main>
      <footer data-shell="footer"><PublicFooter /></footer>
    </div>
  );
}
```

## 3. 実装中の検証

各ステップ完了時に以下を実行:

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  src/lib/auth-view/__tests__/resolveAuthView.spec.ts \
  src/components/public/__tests__/PublicHeader.spec.tsx
```

## 4. 完了条件（Phase 5 内）

- [ ] 8 ファイル変更コミット可能状態
- [ ] vitest 10 ケース全 PASS
- [ ] typecheck green

## 5. 注意（Lessons より）

- **FB-SDK-07-2**: 新規 IPC surface 無し（該当外）
- **FB-CRONVL-002**: 後続タスク（B/C/E/G）の UI 統合は scope out、本タスクは基盤のみ
- **VSCPKR-03**: `authView` は external prop、内部 state なし
