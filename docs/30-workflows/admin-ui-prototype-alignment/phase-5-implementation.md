---
実装区分: 実装仕様書
状態: completed
Phase: 5
作成日: 2026-05-23
task_id: admin-ui-prototype-alignment
親: [index.md](./index.md)
前: [phase-4-test-plan.md](./phase-4-test-plan.md)
次: [phase-6-test-additions.md](./phase-6-test-additions.md)
---

# Phase 5: 実装手順

## 0. 適用範囲

本 Phase は、Phase 2 の設計に従い `apps/web` 配下の admin 領域に以下を導入する手順を定義する。

- 新規共通コンポーネント群 `apps/web/src/features/admin/components/_shared/` (6 component + barrel)
- 11 admin route の page.tsx 改修 (per-section degrade 適用)
- `app/(admin)/layout.tsx` shell 整合
- `app/(admin)/admin/error.tsx` の degrade 残存ケース限定化
- 既存 `apps/web/src/components/admin/*.tsx` の共通コンポーネント差し替え

副作用 (DB / 外部 API / Cloudflare resource) は一切伴わない (canUseTool: 標準 Read/Edit/Write のみ)。

## 1. 実装順序 (5 Lane)

| Lane | 概要 | 完了条件 |
| ---- | ---- | ---- |
| **A** | 共通コンポーネント `_shared/` 6 個 + barrel + 単体 spec | TC-SC/SE/ES/ST/TB/QP/utils 全 PASS |
| **B** | layout + dashboard (page / `_dashboard/` / attendance) | TC-PG-DASH / ATT PASS、TC-SMK-001/002 PASS |
| **C** | members + tags (page / `_members/` / TagQueuePanel) | TC-PG-MEM / TAG PASS、TC-SMK-003/004 PASS |
| **D** | meetings + schema (page / `[id]` / history / panels) | TC-PG-MTG / SCM PASS、TC-SMK-005/006/007 PASS |
| **E** | requests + identity-conflicts + audit | TC-PG-REQ / IDC / AUD PASS、TC-SMK-008/009/010 PASS |

Lane B-E は A 完了後に **並列実行可** (component 依存が _shared に集約される設計のため)。

## 2. Lane A: 共通コンポーネント実装

### 2.1 `AdminSectionCard.tsx`

`apps/web/src/features/admin/components/_shared/AdminSectionCard.tsx`

```tsx
import type { ElementType, ReactNode } from "react";
import { Card } from "@/components/ui/Card";

export type AdminSectionCardTone = "default" | "muted" | "danger" | "success";

export interface AdminSectionCardProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  tone?: AdminSectionCardTone;
  as?: ElementType;
  className?: string;
  children?: ReactNode;
}

export function AdminSectionCard({
  title,
  description,
  actions,
  tone = "default",
  as: As = "section",
  className,
  children,
}: AdminSectionCardProps) {
  // 1. Card primitive を root にラップ (border / radius / spacing は Card に委譲)
  // 2. header 行: 左に title (h2) + description (p)、右に actions slot
  // 3. tone に応じて Card の data-tone 属性 / OKLch token class を付与
  // 4. children を Card body にそのまま展開
  // 実装: Card を render 関数で wrap し、As タグ属性を上書き可能にする
}
```

実装方針:
- HEX 禁止。`tone` → `data-tone` 属性のみ。CSS 側 (`tokens.css` の `[data-tone="danger"]`) で OKLch を解決する。
- title は `aria-labelledby` 用に id を内部生成し Card に紐付ける。
- `actions` は `header > div:last-child` に配置 (right-align)。

### 2.2 `AdminSectionError.tsx`

`apps/web/src/features/admin/components/_shared/AdminSectionError.tsx`

```tsx
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { AdminSectionCard } from "./AdminSectionCard";

export interface AdminSectionErrorProps {
  title?: string;
  message: string;
  errorId?: string;
  onRetry?: () => void | Promise<void>;
  retryLabel?: string;
  hint?: ReactNode;
}

export function AdminSectionError({
  title = "セクションを表示できませんでした",
  message,
  errorId,
  onRetry,
  retryLabel = "再試行",
  hint,
}: AdminSectionErrorProps) {
  // 1. AdminSectionCard tone="danger" でラップ
  // 2. body: message (line-clamp-3) + errorId (mono font) + hint
  // 3. onRetry が truthy のとき Button (variant="secondary") を render
}
```

`onRetry` は server component 側からは渡せないため、`page.tsx` 側で client wrapper (`"use client"`) を 1 行作って差し込むか、`onRetry` 未指定で render する。

### 2.3 `AdminEmptyState.tsx`

```tsx
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";

export interface AdminEmptyStateCta {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface AdminEmptyStateProps {
  title: string;
  description?: string;
  illustration?: ReactNode;
  cta?: AdminEmptyStateCta;
}

export function AdminEmptyState({
  title,
  description,
  illustration,
  cta,
}: AdminEmptyStateProps) {
  // 1. center align column flex layout
  // 2. illustration slot (default は無し)
  // 3. cta が href のとき <a><Button/></a>, onClick のとき <Button onClick/>
}
```

### 2.4 `AdminStat.tsx`

```tsx
export type AdminStatTone = "neutral" | "up" | "down";

export interface AdminStatProps {
  label: string;
  value: number | string;
  unit?: string;
  delta?: number;
  loading?: boolean;
  hint?: string;
}

export function AdminStat(props: AdminStatProps) {
  // 1. label (caption) + value (display) + unit (small)
  // 2. delta が number のとき formatDelta(delta) で sign 付き render
  // 3. delta tone: > 0 → "up"、< 0 → "down"、== 0 → "neutral"
  // 4. loading=true のとき skeleton (animate-pulse 相当の token class)
}

export function formatStatValue(v: number | string): string {
  if (typeof v === "string") return v;
  return new Intl.NumberFormat("ja-JP").format(v);
}

export function formatDelta(delta: number): string {
  const sign = delta > 0 ? "+" : "";
  return `${sign}${new Intl.NumberFormat("ja-JP").format(delta)}`;
}
```

### 2.5 `AdminTable.tsx`

```tsx
import type { ReactNode } from "react";

export type AdminTableSortDir = "asc" | "desc";

export interface AdminTableColumn<T> {
  key: string;
  header: ReactNode;
  cell?: (row: T) => ReactNode;
  align?: "left" | "right" | "center";
  sortable?: boolean;
  width?: string;
}

export interface AdminTableProps<T> {
  columns: AdminTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  sortKey?: string;
  sortDir?: AdminTableSortDir;
  onSort?: (key: string, dir: AdminTableSortDir) => void;
  stickyHeader?: boolean;
  loading?: boolean;
  emptyFallback?: ReactNode;
  caption?: string;
  ariaLabel?: string;
}

export function AdminTable<T>(props: AdminTableProps<T>) {
  // 1. <table> + caption (visually hidden if not provided)
  // 2. <thead> sticky if stickyHeader
  // 3. column.sortable のとき header に button + aria-sort
  // 4. rows.length === 0 のとき tbody に emptyFallback (default = AdminEmptyState)
  // 5. cell render: column.cell ?? (row) => (row as any)[column.key]
}
```

### 2.6 `AdminQueuePanel.tsx`

```tsx
import type { ReactNode } from "react";

export interface AdminQueuePanelItem {
  id: string;
}

export interface AdminQueuePanelProps<T extends AdminQueuePanelItem> {
  items: T[];
  selectedId?: string;
  onSelect: (id: string) => void;
  renderItem: (item: T, isSelected: boolean) => ReactNode;
  renderDetail: (item: T) => ReactNode;
  emptyState?: ReactNode;
  detailPlaceholder?: ReactNode;
  loading?: boolean;
  ariaLabel?: string;
}

export function AdminQueuePanel<T extends AdminQueuePanelItem>(
  props: AdminQueuePanelProps<T>,
) {
  // 1. grid 2 column: 左 list (overflow-y auto)、右 detail (sticky)
  // 2. items.length === 0 のとき左 = emptyState、右 = detailPlaceholder
  // 3. selectedId が items に含まれない場合は右 = detailPlaceholder
  // 4. left list item は <button type="button" onClick={() => onSelect(item.id)}>
}
```

### 2.7 `index.ts` barrel

```ts
export { AdminSectionCard } from "./AdminSectionCard";
export type { AdminSectionCardProps, AdminSectionCardTone } from "./AdminSectionCard";
export { AdminSectionError } from "./AdminSectionError";
export type { AdminSectionErrorProps } from "./AdminSectionError";
export { AdminEmptyState } from "./AdminEmptyState";
export type { AdminEmptyStateProps, AdminEmptyStateCta } from "./AdminEmptyState";
export { AdminStat, formatStatValue, formatDelta } from "./AdminStat";
export type { AdminStatProps, AdminStatTone } from "./AdminStat";
export { AdminTable } from "./AdminTable";
export type {
  AdminTableProps,
  AdminTableColumn,
  AdminTableSortDir,
} from "./AdminTable";
export { AdminQueuePanel } from "./AdminQueuePanel";
export type { AdminQueuePanelProps, AdminQueuePanelItem } from "./AdminQueuePanel";
```

## 3. Lane B: layout + dashboard

### 3.1 `apps/web/app/(admin)/layout.tsx`

修正点:
- sidebar: プロトタイプ `pages-admin.jsx` L18-66 (`AdminShell` 派生) と同じ nav 構造に整合 (順序: ダッシュボード / 会員 / タグ / 会合 / スキーマ / リクエスト / 本人確認 / 監査ログ)
- header: 既存 `AdminPageHeader` をそのまま利用 (本ファイルでは render しない。各 page で render)
- shell の grid: 左 fixed 240px / 右 fluid
- OKLch token class のみ使用 (HEX 削除)

### 3.2 `apps/web/app/(admin)/admin/page.tsx` (Dashboard)

現状: `await fetchAdmin<AdminDashboardView>("/admin/dashboard")` 1 回失敗 → 画面全停止。

改修:

```tsx
import { safeServerFetch } from "@/lib/safeServerFetch";
import {
  AdminSectionCard,
  AdminSectionError,
} from "@/features/admin/components/_shared";

export default async function AdminDashboardPage() {
  // 1. dashboard / activity / queues を独立に fetch
  const [dashboard, activity, queues] = await Promise.all([
    safeServerFetch<AdminDashboardView>("/admin/dashboard"),
    safeServerFetch<AdminActivityView>("/admin/activity"),
    safeServerFetch<AdminQueuesView>("/admin/queues"),
  ]);

  return (
    <>
      <AdminPageHeader title="ダッシュボード" />
      <AdminSectionCard title="概況">
        {dashboard.ok
          ? <DashboardKpiGrid data={dashboard.value} />
          : <AdminSectionError message={dashboard.error.message} errorId={dashboard.errorId} />}
      </AdminSectionCard>
      <AdminSectionCard title="アクティビティ">
        {activity.ok
          ? <ActivityTimeline data={activity.value} />
          : <AdminSectionError message={activity.error.message} errorId={activity.errorId} />}
      </AdminSectionCard>
      <AdminSectionCard title="未処理キュー">
        {queues.ok
          ? <QueueOverview data={queues.value} />
          : <AdminSectionError message={queues.error.message} errorId={queues.errorId} />}
      </AdminSectionCard>
    </>
  );
}
```

`safeServerFetch` (新規 helper) の signature:

```ts
// apps/web/src/lib/admin/safe-server-fetch.ts (新規)
export type SafeResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: Error; errorId: string };

export async function safeServerFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<SafeResult<T>>;
```

これにより `error.tsx` boundary には到達せず、page 全体は常に 200 を返す。

### 3.3 dashboard `_dashboard/` 6 component 整合

`apps/web/src/features/admin/components/_dashboard/*.tsx` の各 component で:
- Card direct → `AdminSectionCard` に差し替え
- KPI 表示 → `AdminStat` に差し替え
- HEX 直書きを `tokens.css` 経由に置換

### 3.4 `app/(admin)/admin/dashboard/attendance/page.tsx`

`safeServerFetch` 適用 + `AdminSectionCard` 包む + table を `AdminTable` 化。

## 4. Lane C: members + tags

### 4.1 `app/(admin)/admin/members/page.tsx`

- `safeServerFetch` で `/admin/members` 取得
- `AdminTable<MemberRow>` で列定義 (氏名 / メール / status / tags / 入会日)
- 検索 / filter は client component (`MembersToolbar.tsx`) を `_members/` に置く (既存があれば再利用)
- empty: `AdminEmptyState`

### 4.2 `app/(admin)/admin/tags/page.tsx`

- `AdminQueuePanel<TagQueueItem>` を使い left list = 未解決タグ、right = `TagsQueueResolveDrawer` の content を inline render
- mutation は `useAdminMutation` 経由のみ
- `apps/web/src/components/admin/TagQueuePanel.tsx` → 内部実装を `AdminQueuePanel` ラッパーに置換
- `TagsQueueResolveDrawer.tsx` → `FormField` 経由のみ、HEX 削除

## 5. Lane D: meetings + schema

### 5.1 `app/(admin)/admin/meetings/page.tsx` + `[id]/page.tsx`

- 一覧: `AdminTable<MeetingRow>` (タイトル / 日時 / 出席数 / 状態)
- 詳細: `AdminSectionCard` 複数 (概要 / 出席者 / 添付)
- `MeetingPanel.tsx` を `AdminSectionCard` ベースにリファクタ

### 5.2 `app/(admin)/admin/schema/page.tsx` + `history/page.tsx`

- diff: `SchemaDiffPanel` 内部を `AdminSectionCard` + `AdminTable`
- history: `SchemaDiffHistoryPanel` を `AdminSectionCard` + `AdminTable`
- bulk resolve modal: `SchemaDiffBulkResolveModal` は既存 Drawer primitive 流用、FormField 経由

## 6. Lane E: requests + identity-conflicts + audit

| Page | 改修 |
| ---- | ---- |
| `requests/page.tsx` | `AdminQueuePanel` 化 + `RequestQueuePanel.tsx` を wrapper 化 |
| `identity-conflicts/page.tsx` | `AdminTable<IdentityConflictRow>` 化、行詳細は drawer |
| `audit/page.tsx` | `AdminTable<AuditLogRow>` + filter toolbar |

## 7. Error boundary 戦略実装

### 7.1 `app/(admin)/admin/error.tsx` 改修

本ファイルが発火するのは以下のみに限定する:
- 認証失敗で page render 自体が throw した場合
- `safeServerFetch` で覆っていない unexpected runtime error
- 全 fetch が `safeServerFetch` 化されている前提で「ほぼ到達しない」設計

UI: 既存「管理画面を表示できませんでした (エラーID: …)」を保持しつつ、本文に「該当する画面のみ再読込してください」リンク (`location.reload()`) を追加。

### 7.2 server side helper の例外方針

`safeServerFetch` は throw しない (Promise reject を catch して `SafeResult` で表現)。これにより上位 try/catch 不要、`error.tsx` への伝搬を遮断する。

## 8. Token 整合 check 手順

実装中・実装後に以下を実行し **0 件** を確認する:

```bash
grep -rEn "bg-\[#|text-\[#|border-\[#|#[0-9a-fA-F]{3,8}" \
  apps/web/app/\(admin\) \
  apps/web/src/components/admin \
  apps/web/src/features/admin
```

検出されたら `apps/web/src/styles/tokens.css` の `--ubm-color-*` token への置換に修正する (既存トークン値の変更は禁止)。

## 9. Files to change

| Path | 種別 | 概要 | Lane |
| ---- | ---- | ---- | ---- |
| `apps/web/src/features/admin/components/_shared/AdminSectionCard.tsx` | new | section card 共通 | A |
| `apps/web/src/features/admin/components/_shared/AdminSectionError.tsx` | new | per-section error | A |
| `apps/web/src/features/admin/components/_shared/AdminEmptyState.tsx` | new | empty state | A |
| `apps/web/src/features/admin/components/_shared/AdminStat.tsx` | new | KPI | A |
| `apps/web/src/features/admin/components/_shared/AdminTable.tsx` | new | generic table | A |
| `apps/web/src/features/admin/components/_shared/AdminQueuePanel.tsx` | new | queue 2-col | A |
| `apps/web/src/features/admin/components/_shared/index.ts` | new | barrel | A |
| `apps/web/src/features/admin/components/_shared/__tests__/*.spec.tsx` | new | unit test | A |
| `apps/web/src/lib/admin/safe-server-fetch.ts` | new | server fetch helper | A |
| `apps/web/src/lib/admin/__tests__/safe-server-fetch.spec.ts` | new | helper test | A |
| `apps/web/app/(admin)/layout.tsx` | edit | sidebar / shell 整合 | B |
| `apps/web/app/(admin)/admin/error.tsx` | edit | degrade 残存ケース限定 | B |
| `apps/web/app/(admin)/admin/page.tsx` | edit | per-section degrade | B |
| `apps/web/app/(admin)/admin/dashboard/attendance/page.tsx` | edit | safeServerFetch + AdminTable | B |
| `apps/web/src/features/admin/components/_dashboard/*.tsx` | edit | AdminSectionCard / AdminStat 化 | B |
| `apps/web/app/(admin)/admin/members/page.tsx` | edit | AdminTable 化 | C |
| `apps/web/app/(admin)/admin/tags/page.tsx` | edit | AdminQueuePanel 化 | C |
| `apps/web/src/components/admin/TagQueuePanel.tsx` | edit | AdminQueuePanel ラッパー化 | C |
| `apps/web/src/components/admin/TagsQueueResolveDrawer.tsx` | edit | FormField / token 整合 | C |
| `apps/web/app/(admin)/admin/meetings/page.tsx` | edit | AdminTable 化 | D |
| `apps/web/app/(admin)/admin/meetings/[id]/page.tsx` | edit | AdminSectionCard 化 | D |
| `apps/web/src/components/admin/MeetingPanel.tsx` | edit | AdminSectionCard 化 | D |
| `apps/web/app/(admin)/admin/schema/page.tsx` | edit | AdminSectionCard + AdminTable | D |
| `apps/web/app/(admin)/admin/schema/history/page.tsx` | edit | AdminSectionCard + AdminTable | D |
| `apps/web/src/components/admin/SchemaDiffPanel.tsx` | edit | 共通化 | D |
| `apps/web/src/components/admin/SchemaDiffHistoryPanel.tsx` | edit | 共通化 | D |
| `apps/web/src/components/admin/SchemaDiffBulkResolveModal.tsx` | edit | FormField / token 整合 | D |
| `apps/web/app/(admin)/admin/requests/page.tsx` | edit | AdminQueuePanel 化 | E |
| `apps/web/src/components/admin/RequestQueuePanel.tsx` | edit | wrapper 化 | E |
| `apps/web/app/(admin)/admin/identity-conflicts/page.tsx` | edit | AdminTable 化 | E |
| `apps/web/src/components/admin/IdentityConflictRow.tsx` | edit | token 整合 | E |
| `apps/web/app/(admin)/admin/audit/page.tsx` | edit | AdminTable + filter toolbar | E |
| `apps/web/src/components/admin/AuditLogPanel.tsx` | edit | wrapper 化 | E |
| `apps/web/src/components/admin/Breadcrumb.tsx` | edit | token 整合のみ | E |
| `apps/web/playwright/tests/admin-routes-smoke.spec.ts` | new | smoke E2E | E |
| `apps/web/src/styles/tokens.css` | edit (条件付き) | 不足トークンがあれば追加 (既存値変更禁止) | A |

> delete 対象: なし。

## 10. ローカル実行・検証コマンド

```bash
mise exec -- pnpm install
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
mise exec -- pnpm --filter @ubm-hyogo/web build
# vitest は Phase 4 §10 のコマンドで実行
# Playwright smoke
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  apps/web/playwright/tests/admin-routes-smoke.spec.ts --project=chromium
```

## 11. DoD (Phase 5)

- [ ] Lane A の 6 component + barrel + helper が存在し、TC-SC/SE/ES/ST/TB/QP/utils が PASS
- [ ] Lane B-E の page 改修が完了し、TC-PG-* が PASS
- [ ] `app/(admin)/admin/page.tsx` で `fetchAdmin` を直接 `await` しない (全て `safeServerFetch`)
- [ ] `grep` token check が 0 件
- [ ] `pnpm typecheck` / `pnpm lint` / `pnpm build` PASS
- [ ] Playwright smoke 全 11 case PASS
- [ ] 副作用 (DB / 外部 API / Cloudflare resource 操作) を一切伴っていない

## 12. canUseTool / 副作用注意

## メタ情報

- task_id: `admin-ui-prototype-alignment`
- Phase: 5
- workflow_state: `implemented_local_runtime_pending`

## 目的

Phase 2 の設計と Phase 4 の test contract に従って、admin UI alignment の実装手順を固定する。

## 実行タスク

- Lane A で `_shared` 6 component + barrel + `safeServerFetch` を実装する
- Lane B〜E で 11 route をプロトタイプ正本へ整合させる
- API / D1 / auth 仕様を変更しないことを確認する

## 参照資料

- `phase-2-design.md`
- `phase-4-test-plan.md`
- `docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx`

## 成果物/実行手順

- Files to change 表に沿って `apps/web` の実ファイルを変更する
- 実装後に Phase 4 の targeted tests を実行する

## 統合テスト連携

- Lane A の component/helper tests を先に通し、B〜E の page tests と Playwright smoke へ進む

## 完了条件

- [ ] 変更対象 file、実装順、検証コマンド、DoD が Phase 4 / 9 / 11 と整合している

- 本 Phase の実装は `apps/web` 配下のソース変更のみ。
- `wrangler` / `scripts/cf.sh` の呼び出し: **該当なし**
- DB migration / D1 操作: **該当なし** (不変条件 #4)
- 外部 API 実打鍵: **該当なし** (Phase 11 で staging 確認のみ)
