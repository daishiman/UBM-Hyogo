# Phase 6 — 実装手順

## メタ情報

| 項目 | 内容 |
| --- | --- |
| Workflow | parallel-10-auth-session-handling |
| Phase | 06 |
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
| Phase output | docs/30-workflows/parallel-10-auth-session-handling/outputs/phase-06/ | Phase成果物 |


後続実行者がそのまま手を動かせる粒度で記述する。

## Step 1: Toast 拡張

1. `apps/web/src/components/ui/Toast.tsx` を開く。
2. `ToastItem` に `variant: "alert" | "status"` を追加。
3. `toast` の signature を `(message: string, variant?: "alert" | "status")` に拡張。デフォルト `"status"`。
4. レンダリングを 2 領域に分割:
   - `<div aria-live="polite">` 配下に `variant === "status"` の item を map。
   - `<div aria-live="assertive">` 配下に `variant === "alert"` の item を map（`role="alert"` 付与）。
5. setTimeout の auto-dismiss は据え置き（3 秒）。

## Step 2: Toast spec 追加

`apps/web/src/components/ui/Toast.spec.tsx` を新規作成:

- `ToastProvider` 配下で `useToast().toast("hello")` → `[role="status"]` に hello が出る。
- `useToast().toast("warn", "alert")` → `[role="alert"]` に warn が出る。
- 3 秒タイマー進行で要素が消える（`vi.useFakeTimers()`）。

## Step 3: useAdminMutation 実装

`apps/web/src/features/admin/hooks/useAdminMutation.ts` を親仕様（parallel-08 / serial-05 step-01）の `endpoint + method + options` API に準拠して実装または拡張する。重要点:

- 先頭に `"use client";`。
- `useToast` は React hook として通常通り呼ぶ。Provider 未配置 fallback は Toast context の default no-op または `toaster` DI で吸収し、hook 呼び出しを try/catch しない。
- `currentPath` 既定:
  ```typescript
  const defaultCurrentPath = () =>
    typeof window === "undefined"
      ? "/"
      : `${window.location.pathname}${window.location.search}`;
  ```
- `redirector` 既定:
  ```typescript
  const defaultRedirector = (url: string) => {
    if (typeof window !== "undefined") window.location.assign(url);
  };
  ```
- catch 内 `instanceof` 判定は `AuthRequiredError` → `FetchAuthedError(403)` → その他の順。
- success 時は既存 serial-05 契約どおり `onSuccess?.(result)` と `router.refresh()` を維持する。

## Step 4: hooks barrel 作成

`apps/web/src/features/admin/hooks/index.ts`:

```typescript
export {
  useAdminMutation,
  type AdminMutationOptions,
  type AdminMutationResult,
} from "./useAdminMutation";
```

## Step 5: useAdminMutation spec

`apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.tsx` で以下 6 ケース:

1. 正常系: `trigger(payload)` が resolve → `isLoading` false / `error` null / 戻り値が result / `router.refresh()` 呼出。
2. 401: `fetchAuthed` が `AuthRequiredError` reject → `redirector` mock が `/login?redirect=%2Fadmin` で呼ばれる。
3. 403: `FetchAuthedError(403, "")` reject → `toaster` mock が `("権限がありません", "alert")` で呼ばれ、`error` に格納。
4. 500: `FetchAuthedError(500, "")` reject → `error` に格納、`toaster` は呼ばれない。
5. 汎用 Error reject → `error` に格納、`onError` callback 呼出。
6. `reset()` 呼出で `error` が null に戻る。

`@testing-library/react` の `renderHook` + `act` を利用。`currentPath: () => "/admin"` を DI 注入。

## Step 6: 既存 spec 補強

- `authed.spec.ts`: status 200/401/403/500/network err の 5 ケース網羅。
- `login-redirect.spec.ts`: `/admin` 正常 / `//evil.com` fallback / `http://evil.com` fallback / バックスラッシュ含み fallback / `/login?redirect=%2Fadmin` fallback。

## Step 7: 検証

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test \
  src/features/admin/hooks/__tests__/useAdminMutation.spec.tsx \
  src/components/ui/Toast.spec.tsx \
  src/lib/fetch/authed.spec.ts \
  src/lib/url/login-redirect.spec.ts
```

build も実行し、各コマンドの stdout を `outputs/phase-11/evidence/{typecheck,lint,test,build}.log` に保存する。

## 完了条件

- `outputs/phase-06/implementation-steps.md` に本 Step 1〜7 が転記され、各 Step 完了チェック欄が用意されていること。
