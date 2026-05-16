# Phase 2 — 設計

## メタ情報

| 項目 | 内容 |
| --- | --- |
| Workflow | parallel-10-auth-session-handling |
| Phase | 02 |
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
| Phase output | docs/30-workflows/parallel-10-auth-session-handling/outputs/phase-02/ | Phase成果物 |


## 設計成果物

| ファイル | 目的 |
| --- | --- |
| `outputs/phase-02/auth-session-policy.md` | session callback / JWT TTL / silent refresh の MVP 採否を確定 |
| `outputs/phase-02/hook-design.md` | `useAdminMutation` の API / 内部実装 / DI 境界を確定 |
| `outputs/phase-02/toast-extension-design.md` | Toast Provider に variant を追加する設計 |
| `outputs/phase-02/error-handling-matrix.md` | status × 経路 × UI 挙動の決定表 |

## 2.1 auth session policy

- `apps/web/src/lib/auth.ts` の JWT 戦略を確認し、TTL（既定 24h）を `auth-session-policy.md` に転記。
- silent refresh は MVP 非導入と決定。理由: Auth.js の refresh token は Google OAuth scope に依存し、UBM の MVP は session 切れ時に 401→`/login?redirect=` で再認証させる方が UX/実装コスト共に有利。
- 結果は `outputs/phase-02/auth-session-policy.md` に表で記録（採用/不採用/根拠 列）。

## 2.2 useAdminMutation hook design

### API（決定値）

```typescript
"use client";

export interface AdminMutationOptions<T = unknown> {
  readonly onSuccess?: (data: T) => void | Promise<void>;
  readonly onError?: (error: Error) => void;
  readonly toastMessage?: string;
  // DI: 既定で `window.location.assign`。test では mock を注入。
  readonly redirector?: (url: string) => void;
  // DI: 既定で ToastProvider の context。test では mock を注入。
  readonly toaster?: (message: string, variant?: "alert" | "status") => void;
  // 現在 path 取得。既定で `window.location.pathname + window.location.search`。
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

### 内部実装方針

1. `useState` で `isLoading` / `error` を保持し、serial-05 step-01 の `endpoint + method` API を維持する。
2. `useToast()` は通常の React hook として常に呼び、Provider 未配置時は Toast context 側の default no-op または `toaster` DI に fallback する（hook 呼び出しを try/catch しない）。
3. `trigger(payload)` 内で `fetchAuthed(endpoint, { method, body: JSON.stringify(payload) })` を呼び、try/catch する。
4. catch:
   - `err instanceof AuthRequiredError` → `redirector(toLoginRedirect(currentPath()))` を呼び、return undefined。
   - `err instanceof FetchAuthedError && err.status === 403` → `toaster("権限がありません", "alert")`、`setError(err)`、return undefined。
   - その他 → `setError(err as Error)`、`onError?.(err as Error)`、return undefined。
5. success 時は `onSuccess?.(result)` と `router.refresh()` を実行し、既存 serial-05 の成功時挙動を維持する。
6. finally で `setIsLoading(false)`。

### 配置

- 新規: `apps/web/src/features/admin/hooks/useAdminMutation.ts`
- 新規 test: `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.tsx`
- export: `apps/web/src/features/admin/hooks/index.ts` で `useAdminMutation` / `AdminMutationOptions` / `AdminMutationResult` を re-export し、`@/features/admin/hooks` import を正本にする。

## 2.3 Toast extension design

- 既存 `ToastProvider` を破壊しない。
- `toast(message)` を `toast(message, variant?: "alert" | "status")` に拡張。デフォルトは `"status"`。
- `ToastItem` に `variant: "alert" | "status"` を追加。`variant === "alert"` の item は別 `<div aria-live="assertive">` 配下に描画。
- 既存テストへの影響: 既存 `toast(string)` 呼び出しは型互換（optional 引数）のため変更不要。

## 2.4 error handling matrix

| 経路 | status | 挙動 | 副作用 |
| --- | --- | --- | --- |
| fetchAuthed | 200 | JSON 返却 | なし |
| fetchAuthed | 401 | `AuthRequiredError` throw | — |
| fetchAuthed | 403 | `FetchAuthedError(403, body)` throw | — |
| fetchAuthed | 5xx | `FetchAuthedError(status, body)` throw | — |
| fetchAuthed | network err | TypeError propagate | — |
| useAdminMutation | catch AuthRequiredError | redirector(toLoginRedirect(currentPath())) | location 遷移 |
| useAdminMutation | catch FetchAuthedError 403 | toaster("権限がありません", "alert"); setError | toast(alert) |
| useAdminMutation | catch FetchAuthedError other | setError; onError | toast 任意 |
| useAdminMutation | catch generic Error | setError; onError | — |
| useAdminMutation | success | onSuccess; router.refresh; toastMessage 任意表示 | server state 再取得 |

## 完了条件

- 上記 4 成果物が `outputs/phase-02/` 配下に存在し、判定値が AC-1〜AC-7 と矛盾しないこと。
