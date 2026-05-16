# Phase 6 — Implementation Steps

| Step | 内容 | 完了 |
| --- | --- | --- |
| 1 | Toast 拡張 (variant 引数 + aria-live 領域 2 分割) | ✅ |
| 2 | Toast.spec.tsx 新規 (3 ケース) | ✅ |
| 3 | useAdminMutation.ts 実装 (`"use client"` + DI + isBrowser guard) | ✅ |
| 4 | hooks barrel (`features/admin/hooks/index.ts`) | ✅ |
| 5 | useAdminMutation.spec.tsx 新規 (6 ケース) | ✅ |
| 6 | 既存 spec 補強 (`authed.spec.ts` / `login-redirect.spec.ts` は既に網羅済みのため変更なし) | ✅ |
| 7 | 検証コマンド実行 (`pnpm typecheck` / `pnpm lint` / `pnpm test` / `pnpm build`) | ✅ |
