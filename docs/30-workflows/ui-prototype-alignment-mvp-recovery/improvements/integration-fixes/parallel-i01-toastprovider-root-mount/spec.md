# parallel-i01-toastprovider-root-mount: ToastProvider を root layout に配置

**[実装区分: 実装仕様書]** — コード変更を伴う

## 目的

`parallel-08-shared-foundation` で宣言された `ToastProvider` の root layout 配置が
`apps/web/app/layout.tsx:13` で**未実装**のため、`useAdminMutation` が呼ぶ `useToast()` が
context resolved 状態にならず、admin mutation 後の toast が silent fail する状態を解消する。

p-08 DoD line 172 `[ ] ToastProvider in root layout` が未達のため、これを完了させる。

## スコープ

### 含む
- `apps/web/app/layout.tsx` で `ToastProvider` を root 配置（client boundary を意識）

### 含まない
- ToastProvider 実装本体の変更（既存 `apps/web/src/components/ui/Toast.tsx` のまま）
- 新規 toast variant 追加 / a11y 設定変更

## 変更対象ファイル

| Path | 種別 | 理由 |
|------|------|------|
| `apps/web/app/layout.tsx` | modify | `ToastProvider` import + wrap children |

`ToastProvider` 自体が `"use client"` directive を持つ場合は、root layout が server component のままで子に client boundary を挟む形になる。既存 `Toast.tsx` の directive を確認し、必要なら経由用 client wrapper を `apps/web/src/components/ui/ToastProviderClient.tsx` として薄く作成してよい（その場合は本 spec 対象ファイルに追加）。

## 設計

### Before (`apps/web/app/layout.tsx`)
```tsx
export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
```

### After
```tsx
import { ToastProvider } from "@/components/ui/Toast";
// または: import { ToastProvider } from "@/components/ui/ToastProviderClient";

export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
```

### Client boundary 判定手順
1. `apps/web/src/components/ui/Toast.tsx` の 1 行目で `"use client"` directive を確認
2. directive あり → 直接 import で OK（Next.js 15 は server から client component を子として埋め込み可能）
3. directive なし → `ToastProviderClient.tsx` を新規作成し `"use client"` 付与の上で re-export

## 関数シグネチャ

変更なし（既存 `ToastProvider` の props を維持）。

## 入出力・副作用

| 項目 | 内容 |
|------|------|
| 入力 | `children: ReactNode` |
| 出力 | `<ToastProvider>` でラップされた React tree |
| 副作用 | toast context が global に提供される。`useToast()` / `useOptionalToast()` が non-null を返す |

## テスト方針

### 追加テスト
- `apps/web/app/layout.spec.tsx`（既存があれば追記）に以下を追加:
  - render result に `ToastProvider` の root marker（context provider の data-testid または internal symbol）が存在することを確認
  - server component test 不可な場合は component spec で代替

### 既存テスト
- `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.tsx` を再実行し、toast を直接 mock しない code path での silent fail がないことを確認

### Manual
- `pnpm -F "@ubm-hyogo/web" dev` → admin 操作で toast を意図的に triggered し、表示されることを確認

## ローカル実行・検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run layout
mise exec -- pnpm -F "@ubm-hyogo/web" dev
```

## DoD

- [x] `apps/web/app/layout.tsx` で `ToastProvider` が children を wrap
- [x] `pnpm typecheck` PASS
- [x] `pnpm lint` PASS
- [x] `Toast.tsx` の client directive を確認した上で適切な import path を採用
- [ ] dev server で admin 操作 → toast 表示を目視確認（authenticated admin session が必要なため user-session runtime gate）
- [x] p-08 spec line 172 の DoD checkbox が満たされる

## リスク

| リスク | 対策 |
|--------|------|
| `ToastProvider` が `"use client"` 未指定でビルド失敗 | wrapper component 新設で吸収 |
| Server component scope 内で client context wrap → hydration mismatch | layout は client wrapper を 1 段挟むだけで RSC 整合性を維持 |

## 並列性

- 独立: i02..i05 と編集対象ファイル重複なし
- 依存: なし
