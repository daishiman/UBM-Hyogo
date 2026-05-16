# Phase 5 — 実装計画

## メタ情報

| 項目 | 内容 |
| --- | --- |
| Workflow | parallel-10-auth-session-handling |
| Phase | 05 |
| Status | spec_created |

## 目的

この Phase の目的は、下記の詳細仕様に従って `parallel-10-auth-session-handling` を spec_created から実装可能な状態へ進めることである。

## 実行タスク

- [ ] 下記の Phase 固有手順を実行する。
- [ ] 成果物と evidence path を確認する。

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| workflow index | docs/30-workflows/parallel-10-auth-session-handling/index.md | 全体仕様 |
| artifacts | docs/30-workflows/parallel-10-auth-session-handling/artifacts.json | 状態台帳 |

## 成果物

| 成果物 | パス | 内容 |
| --- | --- | --- |
| Phase output | docs/30-workflows/parallel-10-auth-session-handling/outputs/phase-05/ | Phase成果物 |


## 変更対象ファイル一覧（CONST_005 必須）

| パス | 種別 | 概要 |
| --- | --- | --- |
| `apps/web/src/features/admin/hooks/useAdminMutation.ts` | 新規または拡張 | 親仕様準拠の admin mutation 共通 hook 実装 |
| `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.tsx` | 新規 | hook unit test（@testing-library/react） |
| `apps/web/src/features/admin/hooks/index.ts` | 新規 | re-export barrel |
| `apps/web/src/components/ui/Toast.tsx` | 編集 | variant 引数追加・alert 用 aria-live="assertive" 領域追加 |
| `apps/web/src/components/ui/Toast.spec.tsx` | 新規 | variant 別描画 test |
| `apps/web/src/lib/fetch/authed.spec.ts` | 編集 | 5 ケース網羅補強 |
| `apps/web/src/lib/url/login-redirect.spec.ts` | 編集 | open redirect 4 ケース補強 |
| `apps/web/src/lib/url/safe-redirect.spec.ts` | 新規（無ければ） | `normalizeRedirectPath` 単体 test |

## 関数・型シグネチャ（決定値）

### useAdminMutation

```typescript
"use client";

import { useCallback, useState } from "react";
import { AuthRequiredError, FetchAuthedError } from "@/lib/fetch/authed";
import { toLoginRedirect } from "@/lib/url/login-redirect";
import { useToast } from "@/components/ui/Toast";

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

### Toast 拡張

```typescript
type ToastVariant = "alert" | "status";

interface ToastItem {
  readonly id: string;
  readonly message: string;
  readonly variant: ToastVariant;
}

interface ToastContextValue {
  readonly toast: (message: string, variant?: ToastVariant) => void;
}
```

## 入出力・副作用（CONST_005 必須）

- `useAdminMutation(endpoint, method, options).trigger(payload)`
  - Input: endpoint string, method `"POST" | "PATCH" | "PUT"`, payload unknown
  - Output: `Promise<T | undefined>`（失敗時は undefined）
  - 副作用:
    - 401 → `redirector(toLoginRedirect(currentPath()))` を呼び、navigation 発火
    - 403 → `toaster("権限がありません", "alert")`、`setError`
    - その他 → `setError`、`onError?.()`
    - 成功 → `onSuccess?.(result)`、`router.refresh()`、`toastMessage` があれば status toast
    - 共通: `setIsLoading(true→false)`
- `Toast.toast(message, variant?)`
  - Input: message string, variant optional
  - 副作用: state push、3 秒後 auto-dismiss

## DoD（Definition of Done）

1. typecheck: `pnpm typecheck` exit 0
2. lint: `pnpm lint` exit 0
3. unit test: `pnpm --filter @ubm-hyogo/web test` で対象 spec が PASS
4. AC-1〜AC-9 すべて PASS
5. `outputs/phase-11/evidence/` に 4 ログ保存
6. Phase 12 必須 7 ファイル生成

## 完了条件

- `outputs/phase-05/implementation-plan.md` に上記 4 項目（変更対象 / シグネチャ / 入出力 / DoD）が転記されていること。
