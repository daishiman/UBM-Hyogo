# parallel-08-shared-foundation: Admin UI 共通基盤の明示化

## 目的

improvements 配下の全 spec（parallel-02, serial-05/step-01..07）が暗黙に前提とする**admin UI 共通基盤**を明示的に整備。
実装ではなく構造宣言のみ。実体は serial-05/step-01 で実施。

---

## スコープ

### 含む
1. ToastProvider の root layout 配置確認・追加
2. ErrorBoundary（admin segment）の配置確認
3. useAdminMutation hook の export パス・型シグネチャ宣言
4. Web layer admin route guard の確認
5. API error response contract の統一

### 含まない
- 新規 API endpoint / 実装本体 / OKLch token / D1 schema 変更

---

## 変更対象ファイル一覧

| Path | 種別 | 理由 |
|------|------|------|
| `apps/web/app/layout.tsx` | modify | ToastProvider を root に配置（現在なし） |
| `apps/web/src/features/admin/hooks/useAdminMutation.ts` | create | 型シグネチャ宣言 |
| `apps/web/src/features/admin/hooks/index.ts` | create | export 構造宣言 |
| `apps/web/app/(admin)/error.tsx` | confirm | 既存OK |
| `apps/web/middleware.ts` | confirm | 既存OK |

---

## 設計

### 1. ToastProvider Root 配置

**現状**: `apps/web/src/components/ui/Toast.tsx` 定義済。`apps/web/app/layout.tsx` では未配置。

**対応**:
```tsx
import { ToastProvider } from "@/components/ui/Toast";

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

---

### 2. ErrorBoundary (Admin)

**確認**: `apps/web/app/(admin)/admin/error.tsx` 存在 ✓
- reset button + エラーメッセージ表示
- useAdminMutation throw を catch 可能

---

### 3. useAdminMutation 型シグネチャ

**ファイル**: `apps/web/src/features/admin/hooks/useAdminMutation.ts`

```ts
export interface AdminMutationOptions {
  onSuccess?: (data: unknown) => void;
  onError?: (error: Error) => void;
  toastMessage?: string;
}

export interface AdminMutationResult {
  mutate: (payload: unknown) => Promise<void>;
  isPending: boolean;
  error: Error | null;
}

export function useAdminMutation(
  endpoint: string,
  options?: AdminMutationOptions
): AdminMutationResult {
  throw new Error("implementation in step-01");
}
```

---

### 4. Export 構造

**ファイル**: `apps/web/src/features/admin/hooks/index.ts`

```ts
export { useAdminMutation, type AdminMutationOptions, type AdminMutationResult } from "./useAdminMutation";
```

Effect: step-02..07 で `import { useAdminMutation } from "@/features/admin/hooks"` 成功。

---

### 5. Web Route Guard & API Contract

**middleware.ts** ✓:
- `/admin/:path*` matcher
- 未ログイン or isAdmin=false → `/login?gate=admin_required`
- ログイン済 + isAdmin=true → next()

**admin layout.tsx** ✓:
- getSession() + 二段防御

**API error shape** ✓:
```json
{ "ok": false, "error": "message" }
```

---

## 関数シグネチャ

```ts
function useAdminMutation(
  endpoint: string,
  options?: AdminMutationOptions
): AdminMutationResult
```

パターン: fetch → parse → error check → callback → toast

---

## 入出力

### Input
- `endpoint`: "/api/admin/members/123"
- `options`: { onSuccess?, onError?, toastMessage? }

### Output
- `{ mutate: () => Promise<void>, isPending: boolean, error: Error | null }`

### Side Effect
- fetch POST/PATCH
- toast via useToast()
- ErrorBoundary trigger (unhandled)

---

## テスト方針

**Vitest**: type import, contract
**Playwright**: admin page load, error catch, toast
**Manual**: useToast() 動作, error.tsx render, serial-05 import 成功

---

## ローカル実行

```bash
pnpm tsc --noEmit          # Type check
pnpm -F "@ubm-hyogo/web" dev  # Dev server
# -> http://localhost:3000/admin
```

---

## DoD

- [ ] ToastProvider in root layout
- [ ] useAdminMutation.ts + index.ts 作成
- [ ] tsc --noEmit で error なし
- [ ] admin/error.tsx 確認
- [ ] middleware/admin guard 確認
- [ ] API error contract 確認
- [ ] serial-05 import 成功
- [ ] 本 spec ≤ 250 行

---

## リスク

1. Root layout 変更 → useToast() scope 拡大 → dev で監視
2. Type-only declaration → step-01 sig 不一致 → step-01 前に再確認
3. API error 不統一 → step-01 で全 endpoint 確認

## 制約

- ToastProvider wrap のみ実装、他は宣言
- useAdminMutation 実装は step-01 責任
- D1 schema / endpoint 追加なし

---

## 並列性

- **独立**: parallel-01..07と独立可能
- **依存**: serial-05/step-01 実装より前完了必須（import 期待）

---

## Tech Stack

- Next.js 15.x (app router)
- React 18.x (context/hooks)
- Hono 4.x (API)
- TypeScript 5.x (strict)

