# Phase 2: 設計

## メタ情報

- taskId: `parallel-08-shared-foundation-admin-ui-foundation`
- phase: 2 / 13
- 実装区分: **実装仕様書**

## 目的

Phase 1 の AC を満たす最小実装 topology を確定する。型シグネチャ・import パス・layer ownership・validation を機械検証可能な粒度まで分解する。

## 実行タスク

1. concern 別 target topology の確定
2. 関数 / 型シグネチャの確定
3. import 経路 4 層整合表（IPC 4 層代替）
4. dependency matrix（owner / co-owner）
5. validation matrix（AC × 検証手段）

## 参照資料

- phase-01.md（AC-1〜AC-7）
- 既存 `apps/web/src/components/ui/Toast.tsx`
- 既存 `apps/web/middleware.ts`

## Target Topology（concern 別）

### Concern A: Toast scope の root 拡張

```
apps/web/app/layout.tsx (Server Component)
└─ <html lang="ja">
   └─ <body>
      └─ <ToastProvider>           ← 追加（client boundary）
         └─ {children}
```

差分（minimal patch）:

```diff
 import type { Metadata } from "next";
 import type { ReactNode } from "react";
+import { ToastProvider } from "@/components/ui/Toast";
 import "@/styles/globals.css";

 export const metadata: Metadata = { ... };

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

### Concern B: useAdminMutation skeleton

ファイル: `apps/web/src/features/admin/hooks/useAdminMutation.ts`

```ts
"use client";

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

/**
 * Admin 系 mutation の共通 hook。
 * fetch → parse → error check → callback → toast の順で動作する。
 *
 * NOTE: 本 hook の実装本体は serial-05/step-01 にて差し込む。
 * 本 phase では型と export 経路のみを固定する skeleton。
 */
export function useAdminMutation(
  mutation: AdminMutationKind,
  _options?: AdminMutationOptions,
): AdminMutationResult {
  throw new Error("implementation in step-01");
}
```

### Concern C: barrel export

ファイル: `apps/web/src/features/admin/hooks/index.ts`

```ts
export {
  useAdminMutation,
  type AdminMutationOptions,
  type AdminMutationResult,
} from "./useAdminMutation";
```

### Concern D: 既存 confirm（差分なし）

- `(admin)/admin/error.tsx`: `"use client"` + `role="alert"` + `<h1>エラーが発生しました</h1>` + reset button — 維持
- `middleware.ts`: matcher `["/admin/:path*", "/profile/:path*"]`、isAdmin guard / 403 — 維持
- API error contract: `apps/api/src/routes/` 配下には既存 `{ error: string }` と `{ ok: false, error: string }` の両形がある。parallel-08 では棚卸しを正本化し、serial-05/step-01 の hook 実装が両方から `Error` message を抽出する契約を固定する。

## 関数 / 型シグネチャ

| Name | Kind | Signature |
|------|------|-----------|
| `useAdminMutation` | function | `(mutation: AdminMutationKind, options?: AdminMutationOptions) => AdminMutationResult` |
| `AdminMutationOptions` | interface | `{ onSuccess?, onError?, toastMessage? }` 全 optional |
| `AdminMutationResult` | interface | `{ mutate, isPending, error }` |
| `ToastProvider` | component | `(props: { readonly children: ReactNode }) => JSX.Element` (既存・変更なし) |

## 入出力・副作用

- **Input**: `mutation: AdminMutationKind`（既存 `apps/web/src/lib/admin/api.ts` helper 名のみ）, `options`
- **Output**: `AdminMutationResult`
- **副作用 (serial-05/step-01 で実装)**: `fetch` 呼び出し / `useToast().toast()` / `setState` による re-render
- **副作用 (本 phase / skeleton)**: 呼び出し時に `Error("implementation in step-01")` を throw → admin segment の `error.tsx` が catch

## Import 経路 4 層整合表（IPC 4 層代替）

Electron IPC は本タスクに非該当。代わりに Next.js App Router における import 経路の 4 層整合を担保する。

| 層 | 役割 | 該当ファイル | 担保事項 |
|----|------|------------|----------|
| L1 App Shell | root layout / metadata | `apps/web/app/layout.tsx` | Provider wrap / Server Component 性維持 |
| L2 Provider | client context boundary | `apps/web/src/components/ui/Toast.tsx` | `"use client"` 宣言 / context throw on missing |
| L3 Feature Hook | admin 専用 hook | `apps/web/src/features/admin/hooks/useAdminMutation.ts` | 型 export / skeleton throw |
| L4 Feature Barrel | import path 安定化 | `apps/web/src/features/admin/hooks/index.ts` | `@/features/admin/hooks` alias 整合 |

整合条件:

- L1 は L2 を default import ではなく **named import** で呼ぶ（tree-shake 維持）
- L3 は **`"use client"` 必須**（hook + React state を後段で扱うため）
- L4 は **type re-export を `type` キーワード付き**で行う（isolatedModules / verbatimModuleSyntax 互換）
- L2/L3/L4 の `@/` alias は `apps/web/tsconfig.json` の paths に従う

## Dependency Matrix

| 変更点 | Owner | Co-owner | 影響範囲 |
|--------|-------|----------|---------|
| layout.tsx wrap | parallel-08 | - | 全 route の client tree |
| useAdminMutation.ts | parallel-08 | serial-05/step-01（実装本体 owner） | admin routes 全体 |
| hooks/index.ts | parallel-08 | - | `@/features/admin/hooks` import 元全件 |
| `(admin)/admin/error.tsx` confirm | parallel-08 | - | admin segment エラー UI |
| `middleware.ts` confirm | parallel-08 | - | 認可境界 |
| API error contract confirm | parallel-08 | apps/api owner | hook の throw 仕様前提 |

## Validation Matrix

| AC | 検証層 | 手段 |
|----|--------|------|
| AC-1 (ToastProvider root) | L1 | Vitest snapshot of layout.tsx import / Playwright DOM 検査 |
| AC-2 (型 export) | L3 | Vitest `expectTypeOf` |
| AC-3 (skeleton throw) | L3 | Vitest runtime `expect(() => useAdminMutation(...)).toThrow("implementation in step-01")` |
| AC-4 (barrel import) | L4 | Vitest `await import("@/features/admin/hooks")` |
| AC-5 (error.tsx 既存) | confirm | grep `role="alert"` / `reset()` |
| AC-6 (middleware) | confirm | grep `matcher` / `isAdmin` |
| AC-7 (API error inventory) | contract | `apps/api/src/routes/**` で `error:` JSON shape grep + hook step-01 が両形を扱う契約の明文化 |

## 統合テスト連携

- Playwright: `/admin` 到達 → ボタンクリック → throw → error.tsx render → reset() で再試行できる経路を pin
- Vitest: 上記 Validation Matrix を実装
- serial-05/step-01 受け入れ条件として `pnpm -F "@ubm-hyogo/web" tsc --noEmit` が pass

## 多角的チェック観点（AI 判断）

- `"use client"` を付ける位置: skeleton hook ファイルにも付けることで、将来の useState/useCallback 導入で破壊変更にならない
- ToastProvider が root にいることで `/login` / `/(public)` でも `useToast` が安全に利用可能（過剰スコープではなく汎用基盤として妥当）
- skeleton の throw メッセージ `"implementation in step-01"` は grep 可能な anchor として残す（後続 step での未実装検知に使える）

## サブタスク管理

- [ ] Topology 確定
- [ ] 型シグネチャ確定
- [ ] 4 層整合表確定
- [ ] Validation Matrix 確定
- [ ] Phase 3 レビュー入力準備

## 成果物

- 本 phase-02.md（topology / signatures / matrices 全 fixed）

## 完了条件 (DoD)

- [ ] Topology 図と差分が確定
- [ ] 全 export の型シグネチャが TS strict で通る前提を満たす
- [ ] 4 層整合表が import 経路を全件カバー
- [ ] Validation Matrix が AC を全網羅

## タスク100%実行確認【必須】

- [ ] 設計が AC を 100% カバー
- [ ] L1〜L4 整合条件が機械検証可能
- [ ] 副作用範囲が明示
- [ ] OKLch HEX / D1 直アクセス / 新規 endpoint いずれも導入していない

## 次 Phase

Phase 3（設計レビュー）: simpler alternative / Phase 4 開始条件 / Phase 13 blocked 条件
