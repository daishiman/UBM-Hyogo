# Phase 8: DRY 化

## 共通化した箇所

| 箇所 | 共通化対象 |
| --- | --- |
| `apps/web/src/lib/admin/api.ts` | mutation の fetch wrapper / エラー型 (`AdminMutationResult`) |
| `apps/web/src/lib/admin/server-fetch.ts` | Server Component からの worker-to-worker fetch |
| `apps/web/app/api/admin/[...path]/route.ts` | client → apps/api proxy（admin 認可 + secret 注入を 1 箇所に集約） |
| `apps/web/app/(admin)/layout.tsx` | admin gate / sidebar 共通 shell |
| `apps/web/src/components/layout/AdminSidebar.tsx` | ナビ定義 |

## 共通化しないと判断した箇所

- KPI カード: 4 種類のみで variation も少なく、`<KpiCard>` を `admin/page.tsx` 内ローカル定義に留める。
- Drawer / Panel: Page ごとに責務が異なるため、共通 abstraction を急がない（YAGNI）。

## 重複検査
- mutation 用 fetch ロジックは `lib/admin/api.ts` のみに集約。各 component から直接 `fetch("/api/admin/...")` してしない。
  - 例外: `MemberDrawer` の **GET** は `lib/admin/api.ts` の export 対象外（GET の result type 共通化は future work）。
