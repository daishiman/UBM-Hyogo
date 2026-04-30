# Admin Pages Design

## 1. 構成図

```mermaid
graph TD
  L[app/(admin)/layout.tsx<br/>auth gate + AdminSidebar] --> D[admin/page.tsx<br/>Dashboard KPI]
  L --> M[admin/members/page.tsx<br/>List + MemberDrawer]
  L --> T[admin/tags/page.tsx<br/>TagQueuePanel]
  L --> S[admin/schema/page.tsx<br/>SchemaDiffPanel]
  L --> Mt[admin/meetings/page.tsx<br/>MeetingPanel]

  D -->|GET /admin/dashboard| API
  M -->|GET /admin/members| API
  M -->|GET /admin/members/:id| API
  M -->|PATCH .../status, POST/PATCH .../notes, DELETE| API
  T -->|GET /admin/tags/queue| API
  T -->|POST /admin/tags/queue/:id/resolve| API
  S -->|GET /admin/schema/diff| API
  S -->|POST /admin/schema/aliases| API
  Mt -->|GET/POST /admin/meetings| API
  Mt -->|POST/DELETE .../attendance| API
  L -.session.-> AUTH[Auth.js v5]
```

## 2. component 階層

| 画面 | page.tsx (Server) | Client |
| --- | --- | --- |
| dashboard | `DashboardKpis`, `RecentSubmissionsTable`, `SchemaStateBadge` | なし |
| members | `MembersFilter`, `MembersTable` | `MemberDrawer` (status switch + Confirm modal + notes CRUD + tag link) |
| tags | `TagQueueList` | `TagQueuePanel` (review + resolve) |
| schema | `SchemaDiffSummary` | `SchemaDiffPanel` (alias form) |
| meetings | `MeetingsList` | `MeetingPanel` (create + attendance) |

## 3. data fetch / mutation matrix

| 画面 | 初期 fetch | mutation | 成功後 |
| --- | --- | --- | --- |
| dashboard | Server Component, `cache: "no-store"` | — | — |
| members | Server Component (一覧) / Client (詳細) | PATCH status / POST notes / DELETE | `router.refresh()` |
| tags | Server Component | POST resolve | `router.refresh()` + Toast |
| schema | Server Component | POST aliases | `router.refresh()` |
| meetings | Server Component | POST meetings / POST/DELETE attendance | `router.refresh()` |

## 4. admin gate 擬似コード

```tsx
// apps/web/app/(admin)/layout.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AdminSidebar } from "@/components/layout/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin");
  if (!session.isAdmin) redirect("/login?gate=forbidden");
  return (
    <div className="admin-shell">
      <AdminSidebar />
      <main className="admin-main">{children}</main>
    </div>
  );
}
```

## 5. ESLint rule

`apps/web/.eslintrc` (or root config delta) に追加:

```json
{
  "rules": {
    "no-restricted-imports": ["error", {
      "patterns": [
        { "group": ["**/repository/**"], "message": "apps/web は D1 repository に直接 import 禁止 (#5)。/admin/* API 経由で取得すること。" },
        { "group": ["cloudflare:*", "wrangler"], "message": "apps/web は Cloudflare runtime API を直接呼ばない (#5)" }
      ]
    }]
  }
}
```

## 6. 不変条件 → 防御策マッピング

| 不変条件 | 設計上の防御 |
| --- | --- |
| #4 | MemberDrawer に profile 本文 input/textarea を持たせない（Phase 7 で grep 検証） |
| #5 | ESLint rule + 共通 fetch helper のみで API 呼び出し |
| #11 | mutation 関数集 (`api.ts`) に profile 本文編集メソッドを置かない |
| #12 | `lib/admin/api.ts` の notes 関数を MemberDrawer 内のみで参照 |
| #13 | MemberDrawer は tag 編集ハンドラを持たず `Link` のみ |
| #14 | SchemaDiffPanel を `app/admin/schema/page.tsx` 以外で import しない |
| #15 | MeetingPanel が `members.filter(m => !m.isDeleted)` を強制、同一会員 attendance は disabled、422 受信で Toast |

## 7. Module 設計

| module | path | 責務 |
| --- | --- | --- |
| AdminSidebar | `apps/web/src/components/layout/AdminSidebar.tsx` | 5 画面ナビ |
| MemberDrawer | `apps/web/src/components/admin/MemberDrawer.tsx` | 詳細 + status switch + notes + tag 導線 |
| TagQueuePanel | `apps/web/src/components/admin/TagQueuePanel.tsx` | queue + resolve |
| SchemaDiffPanel | `apps/web/src/components/admin/SchemaDiffPanel.tsx` | 4 ペイン + alias form |
| MeetingPanel | `apps/web/src/components/admin/MeetingPanel.tsx` | 開催追加 + attendance |
| adminApi | `apps/web/src/lib/admin/api.ts` | mutation 関数集 (fetch wrapper) |

## 8. 環境変数

| 変数 | 用途 |
| --- | --- |
| `AUTH_SECRET` | session JWT 署名 |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth |
| `INTERNAL_API_BASE_URL` | apps/web → apps/api 呼び出し |
| `INTERNAL_AUTH_SECRET` | worker-to-worker 認証 |
