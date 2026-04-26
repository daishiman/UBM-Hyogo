# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 06c-parallel-admin-dashboard-members-tags-schema-meetings-pages |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック |
| Wave | 6 (parallel) |
| 作成日 | 2026-04-26 |
| 前 Phase | 4 (テスト戦略) |
| 次 Phase | 6 (異常系検証) |
| 状態 | pending |

## 目的

5 画面と admin gate / mutation 層の実装手順を runbook + 擬似コード化する。コード placeholder を提示し、別 task の実装フェーズで参照できる形で完結させる（本 task は spec_created）。

## 実行タスク

1. ファイル作成順序の runbook
2. 5 画面ごとの page.tsx 擬似コード
3. mutation 集約 (`lib/admin/api.ts`) 擬似コード
4. admin layout (admin gate) 擬似コード
5. sanity check 手順（typecheck / lint / unit）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/admin-pages-design.md | 設計図 |
| 必須 | outputs/phase-04/admin-test-strategy.md | assertion |
| 必須 | doc/00-getting-started-manual/specs/16-component-library.md | UI primitives |

## 実行手順

### ステップ 1: 作成順
1. `apps/web/src/lib/admin/api.ts`（mutation 関数）
2. `apps/web/src/app/admin/layout.tsx`（admin gate）
3. `apps/web/src/components/layout/AdminSidebar.tsx`
4. `apps/web/src/app/admin/page.tsx`（dashboard）
5. `apps/web/src/components/admin/MemberDrawer.tsx`
6. `apps/web/src/app/admin/members/page.tsx`
7. `apps/web/src/components/admin/TagQueuePanel.tsx`
8. `apps/web/src/app/admin/tags/page.tsx`
9. `apps/web/src/components/admin/SchemaDiffPanel.tsx`
10. `apps/web/src/app/admin/schema/page.tsx`
11. `apps/web/src/components/admin/MeetingPanel.tsx`
12. `apps/web/src/app/admin/meetings/page.tsx`
13. 各セグメントの `loading.tsx` / `error.tsx` / `not-found.tsx`

### ステップ 2: page.tsx 擬似コード（dashboard）
```tsx
// apps/web/src/app/admin/page.tsx
import { fetchAdminDashboard } from '@/lib/admin/api'
export default async function AdminPage() {
  const data = await fetchAdminDashboard() // GET /admin/dashboard
  return (
    <PageContainer>
      <KPICardGrid stats={data.stats} />
      <UnresolvedAlerts unresolvedSchema={data.unresolvedSchema} untaggedCount={data.untaggedCount} />
      <RecentMeetings meetings={data.recentMeetings} />
    </PageContainer>
  )
}
```

### ステップ 3: page.tsx 擬似コード（members）
```tsx
// apps/web/src/app/admin/members/page.tsx
export default async function MembersPage({ searchParams }) {
  const list = await fetchAdminMembers(searchParams)
  return (
    <ClientShell>
      <MemberList list={list} />
      <MemberDrawer />
    </ClientShell>
  )
}
```

### ステップ 4: MemberDrawer（不変条件 #11, #13 の防御）
```tsx
// apps/web/src/components/admin/MemberDrawer.tsx
export function MemberDrawer({ memberId }) {
  const { data } = useSWR(`/admin/members/${memberId}`)
  return (
    <Drawer open={!!memberId} title="メンバー詳細">
      {/* 表示専用: profile 本文は <KVList> で render、input/textarea は使用しない (#11) */}
      <ProfileSection profile={data.profile} readOnly />
      <Switch
        checked={data.publishState === 'public'}
        onChange={(checked) => patchMemberStatus(memberId, { publishState: checked ? 'public' : 'private' })}
      />
      <NotesSection memberId={memberId} notes={data.notes} />
      {/* tag は表示のみ、編集導線は /admin/tags へリンク (#13) */}
      <TagDisplay tags={data.tags} />
      <Link href={`/admin/tags?memberId=${memberId}`}>タグ割当キューで編集</Link>
      <Button as="a" href={data.editResponseUrl} target="_blank">本人に Form 編集を依頼</Button>
    </Drawer>
  )
}
```

### ステップ 5: lib/admin/api.ts（mutation 集約）
```ts
// apps/web/src/lib/admin/api.ts
const ADMIN_BASE = process.env.NEXT_PUBLIC_API_BASE + '/admin'

export async function patchMemberStatus(memberId: string, body: StatusPatch) {
  const res = await fetch(`${ADMIN_BASE}/members/${memberId}/status`, {
    method: 'PATCH', credentials: 'include', body: JSON.stringify(body),
  })
  if (!res.ok) throw new ApiError(res.status, await res.text())
  return res.json()
}
// 他 16 endpoint も同パターン
```

### ステップ 6: admin gate
```tsx
// apps/web/src/app/admin/layout.tsx
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
export default async function AdminLayout({ children }) {
  const session = await auth()
  if (!session?.user) redirect('/login?next=/admin')
  if (!session.user.adminFlag) redirect('/login?error=forbidden')
  return (
    <div className="admin-shell">
      <AdminSidebar />
      <main>{children}</main>
    </div>
  )
}
```

### ステップ 7: MeetingPanel（不変条件 #15）
```tsx
// apps/web/src/components/admin/MeetingPanel.tsx
const candidateMembers = members.filter(m => !m.isDeleted) // (#15)
// 重複登録は UI で disabled、DB constraint で二重防御
const isDuplicate = (memberId) => attendance.some(a => a.memberId === memberId)
```

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 6 | runbook の各ステップで起こりうる失敗を異常系へ |
| Phase 7 | 実装と AC の対応 |
| Phase 8 | DRY 化対象の抽出 |

## 多角的チェック観点

| 不変条件 | runbook での担保 | 確認 |
| --- | --- | --- |
| #4 | MemberDrawer の `readOnly` prop 強制 | code review |
| #5 | adminApi が fetch 経由のみ | grep `import.*repository` 禁止 |
| #11 | profile section は KVList のみ | snapshot test |
| #12 | NotesSection は drawer 内のみ | grep |
| #13 | drawer に TagPicker を render しない | unit test |
| #14 | SchemaDiffPanel は `/admin/schema` のみで render | grep |
| #15 | candidateMembers filter | unit test |

## サンチェック手順

```bash
pnpm -F apps/web typecheck
pnpm -F apps/web lint
pnpm -F apps/web test admin
pnpm -F apps/web build
```

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 作成順 runbook | 5 | pending | 13 ステップ |
| 2 | page.tsx 擬似コード | 5 | pending | 5 画面 |
| 3 | mutation 集約 | 5 | pending | api.ts |
| 4 | admin gate | 5 | pending | layout.tsx |
| 5 | sanity check | 5 | pending | 4 コマンド |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/main.md | サマリー |
| ドキュメント | outputs/phase-05/admin-implementation-runbook.md | 全ステップ + 擬似コード |
| メタ | artifacts.json | Phase 5 を completed |

## 完了条件

- [ ] 13 ステップの作成順が完成
- [ ] 5 画面 + admin gate + mutation の擬似コードが揃う
- [ ] sanity check 手順が動く形で記載
- [ ] 不変条件 7 件すべてに「コード上の担保」が付く

## タスク100%実行確認

- 全擬似コードが指定パスに対応
- typecheck / lint / unit / build の手順が記載
- artifacts.json で phase 5 を completed

## 次 Phase

- 次: 6 (異常系検証)
- 引き継ぎ: 各 mutation の失敗ケースを Phase 6 で網羅
- ブロック条件: 擬似コード未完成なら次へ進めない
