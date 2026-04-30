# Phase 2: 設計 — サマリー

詳細は `admin-pages-design.md` を参照。

- 5 画面の component ツリー / data flow を Mermaid で確定
- admin gate は `app/(admin)/layout.tsx` で `auth()` を呼ぶ方式に統一（middleware は配置しない）
- mutation は `apps/web/src/lib/admin/api.ts` 集約、成功後 `router.refresh()` または client state 更新
- ESLint `no-restricted-imports` で `apps/web` からの D1 / repository 直接 import を禁止
- 既存 secrets（AUTH_SECRET / GOOGLE_*）のみ使用、新規導入なし
