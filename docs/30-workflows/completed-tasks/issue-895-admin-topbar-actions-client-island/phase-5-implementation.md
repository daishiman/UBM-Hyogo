# Phase 5 — 実装手順

## 5.1 変更ファイル一覧

| ファイル | 種別 | 内容 |
|----------|------|------|
| `apps/web/src/features/admin/components/_layout/AdminTopbarActions.tsx` | 新規 | `"use client"` グローバル操作 island（MVP: SignOutButton 集約） |
| `apps/web/src/features/admin/components/_layout/__tests__/AdminTopbarActions.spec.tsx` | 新規 | 単体 spec |
| `apps/web/app/(admin)/layout.tsx` | 編集 | `<AdminTopbar />` → `<AdminTopbar actions={<AdminTopbarActions />} />` |

## 5.2 実装手順

### Step 1: AdminTopbarActions.tsx 作成

`apps/web/src/features/admin/components/_layout/AdminTopbarActions.tsx`:

```tsx
"use client";

import type { ReactElement } from "react";
import { SignOutButton } from "../../../../components/auth/SignOutButton";

/**
 * admin AppShell topbar の actions slot に流し込むグローバル操作 island。
 *
 * 責務境界:
 * - ここに集約するのは「全 admin 画面で共通のグローバル操作」のみ（例: ログアウト、将来の通知ベル）。
 * - 各ページ固有の操作（例: members 画面の「新規追加」、tags 画面の「タグ作成」）は
 *   `AdminPageHeader` の `actions` slot を使うこと。両者を重複させない。
 *
 * client boundary:
 * - 親 `(admin)/layout.tsx` と `AdminTopbar` は Server Component のまま維持する。
 * - client 操作（onClick / signOut）は本 component に閉じ込め、`actions` props 経由で渡す。
 * - AdminTopbar 自体に "use client" を付けてはならない（認証ガード `getSession()` /
 *   `redirect()` が client に漏れ、不変条件 #11 fail-closed が壊れる）。
 */
export function AdminTopbarActions(): ReactElement {
  return (
    <div className="flex items-center gap-2" data-testid="admin-topbar-actions-island">
      <SignOutButton redirectTo="/login" />
    </div>
  );
}
```

### Step 2: (admin)/layout.tsx 修正

`apps/web/app/(admin)/layout.tsx`:

```diff
 import { AdminSidebar } from "../../src/components/layout/AdminSidebar";
 import { AdminTopbar } from "../../src/components/layout/AdminTopbar";
+import { AdminTopbarActions } from "../../src/features/admin/components/_layout/AdminTopbarActions";
 import { getSession } from "../../src/lib/session";
```

```diff
-      <AdminTopbar />
+      <AdminTopbar actions={<AdminTopbarActions />} />
```

### Step 3: spec 追加（Phase 6 で詳細）

`apps/web/src/features/admin/components/_layout/__tests__/AdminTopbarActions.spec.tsx` を新規作成（Phase 6 参照）。

## 5.3 SignOutButton props 確認

実装前に `apps/web/src/components/auth/SignOutButton.tsx` を Read し、以下を確認:

- `size` / `variant` / `redirectTo` props を受けるか
- `aria-label="ログアウト"` または visible label「ログアウト」を持つか

万一 `redirectTo` props が未対応の場合、SignOutButton の現実 API に合わせて引数を調整する（SignOutButton 自体は変更しない・props 注入のみで完結する形に合わせる）。

## 5.4 検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm exec vitest run apps/web/src/features/admin/components/_layout/__tests__/AdminTopbarActions.spec.tsx
mise exec -- pnpm --dir apps/web exec vitest run "app/(admin)/layout.spec.tsx"
mise exec -- pnpm exec vitest run apps/web/src/components/layout/__tests__/AdminTopbar.spec.tsx
```

## 5.5 DoD（このフェーズ）

- 3 ファイル変更がコンパイル可能
- 5.4 のコマンドすべて pass
- AdminTopbar / `(admin)/layout.tsx` に `"use client"` が新規付与されていない（grep で確認）
