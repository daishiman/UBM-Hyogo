# Phase 2.2 — useAdminMutation Hook Design

## API（確定）

```typescript
"use client";

export interface AdminMutationOptions<T = unknown> {
  readonly onSuccess?: (data: T) => void | Promise<void>;
  readonly onError?: (error: Error) => void;
  readonly toastMessage?: string;
  readonly redirector?: (url: string) => void;
  readonly toaster?: (message: string, variant?: "alert" | "status") => void;
  readonly currentPath?: () => string;
}

export interface AdminMutationResult<T = unknown> {
  readonly trigger: (payload: unknown) => Promise<T | undefined>;
  readonly isLoading: boolean;
  readonly error: Error | null;
  readonly reset: () => void;
}

export function useAdminMutation<T = unknown>(
  endpoint: string,
  method: "POST" | "PATCH" | "PUT",
  options?: AdminMutationOptions<T>,
): AdminMutationResult<T>;
```

## 実装方針

1. `useState` で `isLoading` / `error` を管理
2. `useToast()` を常に呼ぶ（Provider 必須）。`toaster` DI が指定された場合はそちらを優先
3. `redirector` 既定: `window.location.assign(url)`（`isBrowser()` guard）
4. `currentPath` 既定: `${pathname}${search}`（`isBrowser()` guard、SSR では `/`)
5. catch 順序: `AuthRequiredError` → `FetchAuthedError(403)` → 汎用 Error
6. 成功時: `toastMessage` があれば status toast、`onSuccess?.()` await、`router.refresh()`
7. finally: `setIsLoading(false)`

## DI 境界

| 引数 | 用途 | 既定 |
| --- | --- | --- |
| `redirector` | 401 時の location 遷移を差し替え可能 | `window.location.assign` |
| `toaster` | toast 関数を差し替え可能 | `useToast().toast` |
| `currentPath` | `/login?redirect=` の埋め込み path 生成 | `location.pathname + location.search` |

## 配置

- 実装: `apps/web/src/features/admin/hooks/useAdminMutation.ts`
- test: `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.tsx`
- barrel: `apps/web/src/features/admin/hooks/index.ts`
