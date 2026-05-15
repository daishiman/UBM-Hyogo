# Phase 5: 実装 — Admin UI 共通基盤の明示化

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
|------|-----|
| workflow | parallel-08-shared-foundation-admin-ui-foundation |
| phase | 5 / 13 |
| 種別 | 実装（コード差分・新規作成・read-only confirm） |
| 想定所要 | 30〜45 分 |
| 前提 Phase | Phase 1〜4（要件・設計・契約確定済み） |
| ソース spec | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-08-shared-foundation/spec.md` |

---

## 目的

`improvements/parallel-08-shared-foundation/spec.md` で定義された admin UI 共通基盤を、実装ファイルとしてコードに落とす。
本 Phase の責務は次の 3 種類のみ:

1. **edit**: `apps/web/app/layout.tsx` に `ToastProvider` を root 配置
2. **create**: `apps/web/src/features/admin/hooks/useAdminMutation.ts` 型 + skeleton（`throw new Error("implementation in step-01")`）
3. **create**: `apps/web/src/features/admin/hooks/index.ts` re-export
4. **confirm (read-only)**: `apps/web/app/(admin)/admin/error.tsx` / `apps/web/middleware.ts` / API error response inventory

> ソース spec の表記は `apps/web/app/(admin)/error.tsx` だが、実在ファイルは `apps/web/app/(admin)/admin/error.tsx`。本 Phase 以降は実在パスを正本とする。

実装本体（fetch / AbortController / toast 連携）は **serial-05/step-01** の責務であり本 Phase のスコープ外。

---

## 実行タスク

| # | 区分 | パス | 操作 |
|---|------|------|------|
| T1 | edit | `apps/web/app/layout.tsx` | `ToastProvider` import + 子要素を wrap |
| T2 | create | `apps/web/src/features/admin/hooks/useAdminMutation.ts` | 型 + skeleton |
| T3 | create | `apps/web/src/features/admin/hooks/index.ts` | re-export |
| T4 | confirm | `apps/web/app/(admin)/admin/error.tsx` | 存在 + `reset` Button + メッセージ表示を grep 確認 |
| T5 | confirm | `apps/web/middleware.ts` | `/admin/:path*` matcher + `gate=admin_required` リダイレクト存在を grep 確認 |
| T6 | confirm | API error inventory | `apps/api/src/routes/**` の `{ error }` / `{ ok: false, error }` 形を grep し件数記録 |

---

## 参照資料

| 種別 | パス |
|------|------|
| 上位 spec | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-08-shared-foundation/spec.md` |
| Toast 実装 | `apps/web/src/components/ui/Toast.tsx`（`ToastProvider` named export を確認） |
| Workflow root | `docs/30-workflows/parallel-08-shared-foundation-admin-ui-foundation/` |
| CLAUDE.md 不変条件 | プロジェクト直下 `CLAUDE.md`（D1 直接アクセス禁止 / OKLch tokens / `getEnv()` 経由） |

---

## 実行手順

### Step 1 — T1: `apps/web/app/layout.tsx` 編集

**現状**:
```tsx
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "UBM Hyogo",
  description: "Runtime foundation for UBM Hyogo",
};

export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
```

**変更後（適用 diff）**:
```diff
 import type { Metadata } from "next";
 import type { ReactNode } from "react";
+import { ToastProvider } from "@/components/ui/Toast";
 import "@/styles/globals.css";

 export const metadata: Metadata = {
   title: "UBM Hyogo",
   description: "Runtime foundation for UBM Hyogo",
 };

 export default function RootLayout({ children }: { readonly children: ReactNode }) {
   return (
     <html lang="ja">
-      <body>{children}</body>
+      <body>
+        <ToastProvider>{children}</ToastProvider>
+      </body>
     </html>
   );
 }
```

> `ToastProvider` は `apps/web/src/components/ui/Toast.tsx` の named export。import path は `@/components/ui/Toast`（`@` は `apps/web/src` に解決）。

### Step 2 — T2: `useAdminMutation.ts` 新規作成

**ファイル**: `apps/web/src/features/admin/hooks/useAdminMutation.ts`

```ts
/**
 * Admin 用 mutation hook の型シグネチャ宣言。
 * 実装本体は serial-05/step-01 で投入する。
 * 本ファイルは type-only contract として step-02..07 の import を成立させる。
 */

export interface AdminMutationOptions {
  readonly onSuccess?: (data: unknown) => void;
  readonly onError?: (error: Error) => void;
  readonly toastMessage?: string;
}

export interface AdminMutationResult {
  readonly mutate: (payload: unknown) => Promise<void>;
  readonly isPending: boolean;
  readonly error: Error | null;
}

export function useAdminMutation(
  mutation: AdminMutationKind,
  options?: AdminMutationOptions,
): AdminMutationResult {
  // intentionally unused — contract stub for step-01 implementation
  void endpoint;
  void options;
  throw new Error("implementation in step-01");
}
```

### Step 3 — T3: `index.ts` 新規作成

**ファイル**: `apps/web/src/features/admin/hooks/index.ts`

```ts
export {
  useAdminMutation,
  type AdminMutationOptions,
  type AdminMutationResult,
} from "./useAdminMutation";
```

### Step 4 — T4: `error.tsx` read-only 確認

```bash
test -f apps/web/app/\(admin\)/admin/error.tsx && echo OK
grep -n "reset" apps/web/app/\(admin\)/admin/error.tsx
```

**期待値**: ファイル存在、`reset` prop を使った再試行 UI が含まれる。差分書き込みは禁止。

### Step 5 — T5: `middleware.ts` read-only 確認

```bash
test -f apps/web/middleware.ts && echo OK
grep -nE "admin|gate=admin_required" apps/web/middleware.ts
```

**期待値**: `/admin/:path*` matcher と `gate=admin_required` リダイレクトロジックが存在。

### Step 6 — T6: API error inventory 確認

```bash
rg -n "json\\(\\{\\s*(ok:\\s*false,\\s*)?error:" apps/api/src/routes -g '*.ts'
```

**期待値**: 0 件超。既存 route には `{ error: string }` 形も存在するため、serial-05/step-01 の parser は両形を扱う。差分書き込みは禁止。

---

## 統合テスト連携

- Phase 6 の Vitest で `useAdminMutation` の型 import が成立すること（contract test）。
- Phase 6 の Playwright smoke で `/admin` route の初回ロード時に ToastProvider 由来のランタイムエラーが発生しないこと。
- serial-05/step-01 投入時、本 Phase 由来の export パスが破壊的変更されないこと（API surface freeze）。

---

## 多角的チェック観点（AIが判断）

- ToastProvider の `children` prop 型と root layout の `ReactNode` が整合するか
- `useAdminMutation` の戻り型 `Promise<void>` が step-01 の実装余地（AbortController, fetch chain）を阻害しないか
- `readonly` 修飾子により step-01 で意図しない代入を防止できているか
- import path `@/components/ui/Toast` が `tsconfig.json` の path alias と一致するか
- 確認系 (T4/T5/T6) が **read-only** 原則を守り、誤って差分を生まないか

---

## サブタスク管理

| ID | 内容 | 完了条件 |
|----|------|---------|
| ST-05-01 | layout.tsx diff 適用 | `grep ToastProvider apps/web/app/layout.tsx` がヒット |
| ST-05-02 | useAdminMutation.ts 作成 | ファイル存在 + 3 export（function + 2 interface） |
| ST-05-03 | index.ts 作成 | ファイル存在 + 3 re-export |
| ST-05-04 | error.tsx 確認ログ | 存在 + reset 含む（記録のみ） |
| ST-05-05 | middleware.ts 確認ログ | matcher 確認（記録のみ） |
| ST-05-06 | API error shape 確認ログ | grep カウント記録 |

---

## 成果物

- `apps/web/app/layout.tsx`（diff 適用済み）
- `apps/web/src/features/admin/hooks/useAdminMutation.ts`（新規）
- `apps/web/src/features/admin/hooks/index.ts`（新規）
- `outputs/phase-05/confirm-log.md`（T4..T6 のコマンド出力ログ）

---

## 完了条件 (DoD)

- [ ] T1〜T3 のファイル変更が git diff で確認できる
- [ ] `mise exec -- pnpm tsc --noEmit` で 0 error
- [ ] `mise exec -- pnpm lint` で 0 error / 0 warning（本 Phase 触れたファイル範囲）
- [ ] T4/T5/T6 の grep 結果が `outputs/phase-05/confirm-log.md` に保存されている
- [ ] CLAUDE.md 不変条件 (D1 直接アクセスなし / OKLch token 直書きなし / `getEnv()` 違反なし) を破壊しない

---

## タスク100%実行確認【必須】

```bash
# 1. ファイル存在
test -f apps/web/src/features/admin/hooks/useAdminMutation.ts
test -f apps/web/src/features/admin/hooks/index.ts
grep -q "ToastProvider" apps/web/app/layout.tsx

# 2. 型チェック
mise exec -- pnpm tsc --noEmit

# 3. lint
mise exec -- pnpm lint

# 4. confirm ログ存在
test -f docs/30-workflows/parallel-08-shared-foundation-admin-ui-foundation/outputs/phase-05/confirm-log.md
```

全てのコマンドが exit 0 で完了することを確認すること。1 件でも失敗した場合は Phase 5 を再実行し、Phase 6 に進まない。

---

## 次Phase

→ Phase 6: テスト実行 + カバレッジ計測（Vitest / Playwright smoke / coverage-guard）
