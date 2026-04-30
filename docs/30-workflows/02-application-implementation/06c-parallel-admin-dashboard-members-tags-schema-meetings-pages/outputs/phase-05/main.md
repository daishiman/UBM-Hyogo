# Phase 5: 実装ランブック

## 1. 共通基盤

### `apps/web/src/lib/admin/api.ts` (mutation wrapper)
```ts
export async function patchMemberStatus(memberId: string, body: { publishState?: PublishState; hiddenReason?: string | null }) { /* fetch */ }
export async function postMemberNote(memberId: string, body: string) { /* ... */ }
export async function patchMemberNote(memberId: string, noteId: string, body: string) { /* ... */ }
export async function deleteMember(memberId: string) { /* ... */ }
export async function resolveTagQueue(queueId: string) { /* ... */ }
export async function postSchemaAlias(body: { questionId: string; stableKey: string; diffId?: string }) { /* ... */ }
export async function createMeeting(body: { title: string; heldOn: string; note?: string | null }) { /* ... */ }
export async function addAttendance(sessionId: string, memberId: string) { /* ... */ }
export async function removeAttendance(sessionId: string, memberId: string) { /* ... */ }
```

### `apps/web/src/lib/admin/server-fetch.ts` (Server Component 用)
- `INTERNAL_API_BASE_URL` + `INTERNAL_AUTH_SECRET` で fetch
- `cache: "no-store"`

### `apps/web/src/components/layout/AdminSidebar.tsx`
- 5 リンク + active hash 表示

### `apps/web/app/(admin)/layout.tsx`
- `getSession()` → null/`!isAdmin` redirect → AdminSidebar + main

## 2. 画面別実装順序

| 順 | 画面 | 主要 component |
| --- | --- | --- |
| 1 | dashboard | `app/(admin)/admin/page.tsx` (Server) |
| 2 | members | `admin/members/page.tsx` + `MemberDrawer` |
| 3 | tags | `admin/tags/page.tsx` + `TagQueuePanel` |
| 4 | schema | `admin/schema/page.tsx` + `SchemaDiffPanel` |
| 5 | meetings | `admin/meetings/page.tsx` + `MeetingPanel` |
| 6 | loading/error/not-found | 各セグメント共通 |

## 3. 擬似コード（dashboard）

```tsx
// app/(admin)/admin/page.tsx
import { fetchAdmin } from "@/lib/admin/server-fetch";
import type { AdminDashboardView } from "@ubm-hyogo/shared";

export default async function DashboardPage() {
  const view = await fetchAdmin<AdminDashboardView>("/admin/dashboard");
  return (
    <section>
      <h1>ダッシュボード</h1>
      <KpiGrid totals={view.totals} />
      <SchemaStateBadge state={view.schemaState} />
      <RecentSubmissionsTable items={view.recentSubmissions} />
    </section>
  );
}
```

## 4. 擬似コード（members + drawer）

```tsx
// admin/members/page.tsx (Server)
const list = await fetchAdmin<AdminMemberListView>(`/admin/members${filter ? `?filter=${filter}` : ""}`);
return <MembersClient initial={list} filter={filter} />;

// MembersClient.tsx (Client)
const [selectedId, setSelectedId] = useState<string | null>(null);
return (
  <>
    <MembersFilter value={filter} />
    <MembersTable members={list.members} onSelect={setSelectedId} />
    {selectedId && <MemberDrawer memberId={selectedId} onClose={() => setSelectedId(null)} />}
  </>
);
```

## 5. ESLint rule 配置

`apps/web/eslint.config.mjs` (or `.eslintrc`) に `no-restricted-imports` ルール追加。

## 6. 完了チェック

- [ ] 5 page.tsx 作成
- [ ] 4 component (Drawer/Panel) 作成
- [ ] AdminSidebar / layout
- [ ] `lib/admin/api.ts` + `server-fetch.ts`
- [ ] ESLint rule
- [ ] Vitest 新規テスト 4 ファイル以上
