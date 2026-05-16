# Implementation Guide

## Part 1: 中学生レベル

### なに？

ログインが切れたら自動でログイン画面に飛ばす、権限がない操作をしたら「権限がありません」というお知らせを画面の上に出す、というルールを共通の道具にまとめました。

### なぜ？

これまでは画面ごとに対応がバラバラで、ログインが切れたのか権限がないのか、ユーザーが分からないことがありました。バラバラだと迷うので、全部の管理画面で同じ動きにそろえました。

### どうやって？

`useAdminMutation` という共通の道具（hook）を作って、その中で 401（ログイン切れ）と 403（権限なし）を見分けて、必要な動きをするようにしました。ログイン画面に戻った後で元のページに戻れるように、行き先（path）を安全に覚えておきます。覚えるときに外部サイトに飛ばされないように、`//evil.com` のような怪しい行き先は捨てるチェックをします。

## Part 2: 技術者レベル

### 設計

- same-origin `/api/admin/*` proxy response の 401 / 403 を、mutation 共通 hook で catch して UI 挙動を分岐させる。client hook は `next/headers` 依存の server helper を import しない。
- hook は `endpoint + method + options` を受け取り、`{ trigger, isLoading, error, reset }` を返す client hook。
- catch 順序: `AuthRequiredError` → `FetchAuthedError(403)` → 汎用 Error。
- 401 は `toLoginRedirect(currentPath)` を生成して `window.location.assign` で遷移（`normalizeRedirectPath` で open redirect 防止）。
- 403 は `toaster("権限がありません", "alert")` + `setError`。ToastProvider 未配置時は logger warning のみで throw しない。フォーム state は呼び出し側で保持。
- 成功時は `toastMessage` (status variant) + `onSuccess?.()` await + `router.refresh()`。

### DI 境界

`redirector` / `toaster` / `currentPath` を optional DI とし、vitest では mock 注入で `window` 依存を完全排除。SSR では `isBrowser()` guard で navigation を no-op 化。

### Toast 拡張

`ToastProvider` を後方互換に拡張: `toast(message, variant?: "alert" | "status")`。`variant === "alert"` は `<div aria-live="assertive">` 配下に `role="alert"` で描画、`variant === "status"` は既存 `aria-live="polite"` / `role="status"` 領域を維持。

### Auth Session ポリシー

silent refresh は MVP 不採用。Auth.js JWT は 24h TTL で、その範囲内の expiry は 401 catch → redirect で吸収する。Workers Paid + refresh token 取得が可能になった時点で再検討。詳細は `outputs/phase-02/auth-session-policy.md`。

### 変更ファイル

- 新規: `apps/web/src/features/admin/hooks/useAdminMutation.ts`, `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.tsx`, `apps/web/src/features/admin/hooks/index.ts`, `apps/web/src/components/ui/Toast.spec.tsx`
- 編集: `apps/web/src/components/ui/Toast.tsx`, `apps/web/src/lib/url/safe-redirect.ts`, `apps/web/src/lib/url/login-redirect.spec.ts`, `docs/00-getting-started-manual/specs/02-auth.md`, `.claude/skills/aiworkflow-requirements/indexes/{quick-reference,resource-map}.md`, `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- outputs: phase-01〜12 各成果物

### 検証

```bash
mise exec -- pnpm typecheck            # exit 0
mise exec -- pnpm lint                  # exit 0
mise exec -- pnpm --filter @ubm-hyogo/web test    # PASS
mise exec -- pnpm --filter @ubm-hyogo/web build   # Compiled successfully in 28.1s
```

### スクリーンショット

NON_VISUAL タスクのため screenshot は不要（`outputs/phase-11/visual-verification-skip.md` 参照）。Toast の a11y は vitest で `role="alert"` / `role="status"` を観測して保証。
