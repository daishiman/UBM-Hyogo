# Phase 5: 実装（TDD Green）

[実装区分: 実装仕様書]

> 目的: Phase 4 で Red にしたテストを Green にする。`features/admin/components/_dashboard/*` `_members/*` `_layout/*` の実装と既存 `src/lib/admin/*` client surface の確定、page.tsx 2 ファイルと `(admin)/layout.tsx` の刷新。
> implementation_mode: `new`

---

## 1. 実装計画（変更対象ファイル一覧 — FB-RT-03）

### 1.1 新規作成（Create）— 20 ファイル

| Wave | path | サイズ目安 | 依存 |
|------|------|----------|------|
| W1 | `apps/web/src/lib/admin/admin-dashboard-ui.ts` | 60 行 | shared types |
| W1 | `apps/web/src/lib/admin/dashboard-ui.test.ts` | 60 行 | admin-dashboard-ui |
| W2 | `_layout/AdminPageHeader.tsx` | 30 行 | なし |
| W2 | `_dashboard/KpiCard.tsx` | 50 行 | cn |
| W2 | `_dashboard/KpiGrid.tsx` | 50 行 | KpiCard / admin-types |
| W2 | `_dashboard/ZoneDistribution.tsx` | 80 行 | admin-types |
| W2 | `_dashboard/StatusDistribution.tsx` | 40 行 | admin-types |
| W2 | `_dashboard/RecentActionsTable.tsx` | 70 行 | admin-types / format/datetime |
| W2 | `_dashboard/SchemaAlertCard.tsx` | 30 行 | なし |
| W3 | `_members/MembersFilters.tsx` | 80 行 | ui/Input, ui/Select |
| W3 | `_members/MembersTable.tsx` | 100 行 | admin-types / ui/Badge |
| W3 | `_members/BulkActionBar.tsx` | 70 行 | src/lib/admin/api / ui/Button |
| W3 | `_members/MemberDrawer.tsx` | 80 行 | `/api/admin` proxy / ui/Drawer / ui/Skeleton |
| W3 | `_members/MembersClientShell.tsx` | 90 行 | 全 _members component / src/lib/admin/api |
| W4 | `apps/web/src/features/admin/components/index.ts` | 10 行 | barrel |

### 1.2 修正（Modify）— 3 ファイル

| Wave | path | 修正概要 |
|------|------|---------|
| W1 | `apps/web/src/lib/admin/api.ts` | `patchMemberStatus` / `deleteMember` / `restoreMember` 契約の維持・テスト補強 |
| W1 | `apps/web/src/lib/admin/server-fetch.ts` | `fetchAdmin<T>()` の read path 正本として維持・必要最小補強 |
| W1 | `apps/web/src/lib/admin/types.ts` | admin UI local 型の整理 |
| W4 | `apps/web/app/(admin)/admin/page.tsx` | dashboard SSR + Section 構成 |
| W4 | `apps/web/app/(admin)/admin/members/page.tsx` | members SSR + MembersClientShell 受け渡し |
| **W5** | `apps/web/app/(admin)/layout.tsx` | getSession guard + 2 カラム grid + AdminSidebar |

W5 の layout merge 完了が task-16/17 着手 gate。

---

## 2. 実装タスク詳細

### Task 5-1: admin read/mutation helpers + UI mapper（W1）

**シグネチャ**: Phase 2 §4.1 に準拠。新規 flatten `adminClient` object は作らず、既存 `src/lib/admin/*` に寄せる。

**入出力**:
- input: `INTERNAL_API_BASE_URL` / cookies（`fetchAdmin<T>()` 経由） / `/api/admin/*` proxy
- output: `AdminDashboardView` / `AdminMemberListView` / `AdminMemberDetailView` / `{ ok: true }`
- 副作用: HTTP fetch（`credentials: "include"`、`cache: "no-store"`）

**実装注意**:
- `AdminDashboardViewZ` 自体は変更しない。`byZone` / `byStatus` optional 表示判断は `apps/web/src/lib/admin/admin-dashboard-ui.ts` の mapper に閉じる（**`@ubm-hyogo/shared` を変更しない** — FB-W0-01）
- Server Component read は `fetchAdmin<AdminDashboardView>("/admin/dashboard")` / `fetchAdmin<AdminMemberListView>("/admin/members?...")`
- Client mutation は `patchMemberStatus(memberId, { publishState })` / `deleteMember(memberId, reason)` / `restoreMember(memberId)` を使用

### Task 5-2: _dashboard component 群（W2）

元仕様 §4.3〜4.7 のコード断片をそのまま採用。実装注意:

- `KpiCard` の `tone` は `Record<KpiTone, string>` で OKLch tokens のみ
- `ZoneDistribution` は `byZone === undefined || []` で placeholder（`<p role="status">分布データは現在集計対象外です</p>`）
- `RecentActionsTable` は `formatJstDateTime(row.createdAt)` で JST 表示（`Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo' })` を `apps/web/src/lib/format/datetime.ts` に切り出し、無ければ最小実装で追加）
- `SchemaAlertCard` の背景色は `color-mix(in oklch, var(--ubm-color-warning) 8%, transparent)` で OKLch 経由

### Task 5-3: _members component 群（W3）

元仕様 §5.3〜5.7 のコード断片を採用。

**MembersClientShell 注意**:
- URL 同期は `useTransition` + `router.replace` でナビゲーション、Filter 変更時 `page` を delete
- `selected: Set<string>` の更新は **新しい Set を返す**（参照不変）
- `MemberDrawer` は `openMemberId !== null` の条件マウントで unmount cleanup を活用

**BulkActionBar 注意**（FB-STATE-DETAIL-01: ロック解放）:
```tsx
const run = async (action: Action) => {
  if (selectedIds.length === 0) return;
  setBusy(action);
  try {
    for (const memberId of selectedIds) { /* シリアル fetch */ }
    onComplete();
  } finally {
    setBusy(null);  // ← 正常 / 例外 / unmount どの経路でも null
  }
};
```

**MemberDrawer 注意**（FB-STATE-DETAIL-03: stale guard）:
```tsx
useEffect(() => {
  let cancelled = false;
  setData(null); setError(null);
  fetch(`/api/admin/members/${encodeURIComponent(memberId)}`, { cache: "no-store" })
    .then(r => { if (!cancelled) setData(r); })
    .catch(e => { if (!cancelled) setError(...); });
  return () => { cancelled = true; };
}, [memberId]);
```

### Task 5-4: barrel export（W4）

```ts
// apps/web/src/features/admin/components/index.ts
export * from "./_layout/AdminPageHeader";
export * from "./_dashboard/KpiCard";
export * from "./_dashboard/KpiGrid";
export * from "./_dashboard/ZoneDistribution";
export * from "./_dashboard/StatusDistribution";
export * from "./_dashboard/RecentActionsTable";
export * from "./_dashboard/SchemaAlertCard";
export * from "./_members/MembersClientShell";
export * from "./_members/MembersFilters";
export * from "./_members/MembersTable";
export * from "./_members/BulkActionBar";
export * from "./_members/MemberDrawer";
```

**追記方式厳守**（task-16/17 が後続行追加するため、再ソート禁止）。

### Task 5-5: page.tsx 2 ファイル（W4）

- `(admin)/admin/page.tsx` — 元仕様 §4.2 のコードをそのまま採用、`export const dynamic = "force-dynamic"`
- `(admin)/admin/members/page.tsx` — §5.2 のコードを採用、`searchParams: Promise<...>` の Next.js 15+ async pattern に準拠

### Task 5-6: `(admin)/layout.tsx` 確定（W5）

元仕様 §3.1 のコードを採用。**この commit が task-16/17 着手 gate**。

```tsx
import { redirect } from "next/navigation";
import { AdminSidebar } from "../../src/components/layout/AdminSidebar";
import { getSession } from "../../src/lib/session";
export const dynamic = "force-dynamic";
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin");
  if (!session.isAdmin) redirect("/login?gate=forbidden");
  return (
    <div className="ubm-admin-shell grid min-h-screen grid-cols-[240px_1fr] bg-[var(--ubm-color-bg)] text-[var(--ubm-color-text)]">
      <aside className="border-r border-[var(--ubm-color-border)]"><AdminSidebar /></aside>
      <main className="flex flex-col">{children}</main>
    </div>
  );
}
```

---

## 3. 不変条件再確認チェック

実装中、各ファイル commit 前に確認:

- [ ] HEX 直書き 0 件: `grep -rE 'bg-\[#|text-\[#|border-\[#' apps/web/src/features/admin apps/web/app/\(admin\)`
- [ ] D1 binding import 0 件: `grep -rn 'from "@cloudflare/workers-types"' apps/web/src/features/admin apps/web/src/lib/admin apps/web/app/api/admin`
- [ ] `apps/api` 差分 0 行: `git diff main -- apps/api`
- [ ] node-only パッケージ import 無し: `grep -rn "from \"node:" apps/web/src/features/admin`

---

## 4. ローカル実行コマンド（TDD Green 確認）

```bash
mise exec -- pnpm install
mise exec -- pnpm -F @ubm-hyogo/web typecheck
mise exec -- pnpm -F @ubm-hyogo/web test --run \
  src/features/admin/components/__tests__/KpiGrid.test.tsx \
  src/features/admin/components/__tests__/MembersFilters.test.tsx \
  src/features/admin/components/__tests__/MembersTable.test.tsx \
  src/features/admin/components/__tests__/RecentActionsTable.test.tsx \
  src/features/admin/components/__tests__/BulkActionBar.test.tsx
# 期待: 21 ケース全て PASS

# dev server で目視確認
mise exec -- pnpm -F @ubm-hyogo/web dev
# http://localhost:3000/admin
# http://localhost:3000/admin/members
```

---

## 5. canUseTool 適用可能範囲（FB-P0-09-U1-2）

本タスクは Renderer 側の Anthropic SDK 連携を含まないため該当なし。

---

## 6. 完了条件（DoD）

- [ ] 20 新規ファイルが §1.1 のサイズ目安内で作成完了
- [ ] 6 修正ファイルが旧実装から差し替え完了
- [ ] §3 不変条件チェック 4 項目すべて success
- [ ] §4 vitest 21 ケース全て PASS（TDD Green）
- [ ] dev server で `/admin` `/admin/members` が 200 を返す
- [ ] W5（layout merge）完了タイミングを `outputs/phase-05/wave-log.md` に記録（task-16/17 fan-out gate 通過明示）
- [ ] `outputs/phase-05/implementation-log.md` 生成（変更ファイル一覧 + 各 wave の完了時刻）

## 成果物

- 20 新規ファイル + 6 修正ファイル
- `outputs/phase-05/implementation-log.md`
- `outputs/phase-05/wave-log.md`
- 実行後に `artifacts.json` の `phase05.status` を `completed` へ更新（仕様書作成時点は `spec_created`）
