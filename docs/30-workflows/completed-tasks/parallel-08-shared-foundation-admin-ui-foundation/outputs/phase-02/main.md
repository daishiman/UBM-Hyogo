# Phase 2 成果物 — 設計

## Target Topology

- L1 `apps/web/app/layout.tsx` (Server Component): `<body>` 内に `<ToastProvider>{children}</ToastProvider>` を配置
- L2 `apps/web/src/components/ui/Toast.tsx` (既存・変更なし): `"use client"` Provider + context
- L3 `apps/web/src/features/admin/hooks/useAdminMutation.ts` (新規): `"use client"` 型 + skeleton throw
- L4 `apps/web/src/features/admin/hooks/index.ts` (新規): barrel re-export

## 関数 / 型シグネチャ

```ts
interface AdminMutationOptions { readonly onSuccess?, readonly onError?, readonly toastMessage? }
interface AdminMutationResult  { readonly mutate, readonly isPending, readonly error }
function useAdminMutation(mutation: AdminMutationKind, options?: AdminMutationOptions): AdminMutationResult
```

## Validation Matrix (AC × 検証手段)

| AC | 検証層 | 手段 | 実装後結果 |
|----|--------|------|-----------|
| AC-1 | L1 | layout.tsx grep / runtime DOM | PASS (phase-11 build/test green) |
| AC-2 | L3 | Vitest `expectTypeOf` | PASS (3 tests) |
| AC-3 | L3 | runtime `toThrow("implementation in step-01")` | PASS |
| AC-4 | L4 | dynamic `import("../index")` | PASS |
| AC-5 | confirm | grep `reset` / `role="alert"` | PASS |
| AC-6 | confirm | grep matcher + gate | PASS |
| AC-7 | confirm | API error shape 棚卸し | PASS (両形存在) |

## Import 経路 4 層整合

- L1→L2 named import (`@/components/ui/Toast`), tree-shake 維持
- L3 `"use client"` 必須
- L4 `type` キーワード付き re-export (verbatimModuleSyntax 互換)
- alias `@/` は `apps/web/tsconfig.json` paths に従う

## 制約遵守

- 新規 API endpoint 追加なし
- D1 schema 変更なし
- OKLch HEX 直書きなし
- `apps/web` から D1 直接アクセスなし
