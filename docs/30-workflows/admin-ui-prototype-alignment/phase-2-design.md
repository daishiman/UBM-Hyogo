---
spec_classification: implementation_spec
state: spec_created
phase: 2
phase_name: 設計
created_at: 2026-05-23
task_type: UI task
visual_category: VISUAL
implementation_mode: new (+ verify_existing)
workflow: docs/30-workflows/admin-ui-prototype-alignment/
depends_on: phase-1-requirements.md
---

# Phase 2: 設計

Phase 1 で固定した 11 route × 7 共通 component の責務を、TypeScript インターフェース・state ownership・error 戦略・data flow まで落とし込む。

---

## 1. アーキテクチャ概要

### 1.1 server / client 境界

```
app/(admin)/layout.tsx              [server]  shell + sidebar
app/(admin)/admin/page.tsx          [server]  fetchAdmin × N → SafeResult[]
app/(admin)/admin/error.tsx         [client]  真の uncaught error 専用 (最小化)

_shared/AdminSectionCard            [server]  pure presentation
_shared/AdminSectionError           [server]  pure presentation
_shared/AdminEmptyState             [server]  pure presentation
_shared/AdminStat                   [server]  pure presentation
_shared/AdminTable                  [client]  sort state を内包
_shared/AdminQueuePanel             [client]  selection state を内包
```

### 1.2 失敗の局所化

server component 側で `fetchAdmin` を `Result<T, ApiError>` で受け、各 section に `SafeResult<T>` を渡す。section 内部で `result.ok === false` の場合のみ `AdminSectionError` を render。**throw は最後の手段** とし、page 全体の throw は廃止する。

```ts
// apps/web/src/lib/result.ts (新規予定)
export type SafeResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; correlationId?: string } };
```

```ts
// apps/web/src/lib/fetch-admin-safe.ts (新規予定)
export async function safeServerFetch<T>(path: string): Promise<SafeResult<T>> {
  try {
    const data = await fetchAdmin<T>(path);
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: normalizeApiError(err) };
  }
}
```

---

## 2. 共通コンポーネント仕様

### 2.1 AdminSectionCard

責務: `<section className="card">` 相当の wrapper。heading + 右上 actions slot + children。

```ts
import type { ReactNode } from "react";

export interface AdminSectionCardProps {
  /** section の見出し (h2 で render) */
  title: string;
  /** 補足説明 (heading 下に muted text で配置) */
  description?: string;
  /** 右上のアクション slot (Button / Segmented 等) */
  actions?: ReactNode;
  /** body */
  children: ReactNode;
  /** id (anchor 用) */
  id?: string;
  /** padding 縮小版 (queue 用) */
  density?: "default" | "compact";
  /** 追加 className (Tailwind の余白調整のみ許容) */
  className?: string;
}

export function AdminSectionCard(props: AdminSectionCardProps): JSX.Element;
```

state ownership: なし (pure)。children policy: 任意 React node。

### 2.2 AdminSectionError

責務: section 単位の degrade UI。retry CTA は **Phase 1 スコープ外** とし、本実装では「再読込してください」テキスト + correlation ID 表示のみ。

```ts
export interface AdminSectionErrorProps {
  /** 失敗した section のラベル */
  sectionLabel: string;
  /** API error code (例: "ADMIN_DASHBOARD_FETCH_FAILED") */
  code?: string;
  /** correlation ID (Cloudflare ray ID 等) */
  correlationId?: string;
  /** ユーザ向け 1 文 (任意) */
  message?: string;
}

export function AdminSectionError(props: AdminSectionErrorProps): JSX.Element;
```

variant: `tone="warning" | "critical"` を **本タスクでは導入しない** (YAGNI)。全て同一 tone (`bg-[--ubm-color-bg-warn]` 相当の token) で描画する。

### 2.3 AdminEmptyState

```ts
import type { ReactNode } from "react";

export interface AdminEmptyStateProps {
  /** タイトル (例: "対象データがありません") */
  title: string;
  /** 補足 1 文 */
  description?: string;
  /** 主要 CTA (Button) */
  primaryAction?: ReactNode;
  /** SVG icon name (組み込み済 set から選択。default: "inbox") */
  icon?: "inbox" | "search" | "tag" | "calendar" | "shield";
}

export function AdminEmptyState(props: AdminEmptyStateProps): JSX.Element;
```

state ownership: なし。

### 2.4 AdminStat

KPI 数値表示。既存 `_dashboard/KpiCard` との関係: `KpiCard` は **dashboard 専用 layout (icon + delta + sparkline)**、`AdminStat` は **dashboard 以外 (queue 件数等) で使う汎用版**。重複は Phase 8 で `KpiCard` を `AdminStat` の specialized variant に再構成する判断のみ持ち越し。

```ts
export interface AdminStatProps {
  label: string;
  value: string | number;
  /** 補足 (例: "前週比 +3") */
  hint?: string;
  /** tone (status tone) */
  tone?: "neutral" | "positive" | "warning" | "critical";
  /** スケルトン表示 */
  loading?: boolean;
}

export function AdminStat(props: AdminStatProps): JSX.Element;
```

### 2.5 AdminTable

責務: 共通 table。sort / sticky header / row click を提供。

```ts
import type { ReactNode } from "react";

export interface AdminTableColumn<Row> {
  key: keyof Row & string;
  header: string;
  /** 行 cell の render */
  render?: (row: Row) => ReactNode;
  /** sort 対応 (default: false) */
  sortable?: boolean;
  /** width (CSS length) */
  width?: string;
  /** text-align (default: "left") */
  align?: "left" | "right" | "center";
}

export interface AdminTableProps<Row> {
  columns: AdminTableColumn<Row>[];
  rows: Row[];
  /** 行 key 抽出 */
  getRowKey: (row: Row) => string;
  /** 行クリック (drawer open 等) */
  onRowSelect?: (row: Row) => void;
  /** 選択中 row key (highlight) */
  selectedKey?: string | null;
  /** sticky header (default: true) */
  stickyHeader?: boolean;
  /** empty 時 fallback (default: <AdminEmptyState />) */
  emptyState?: ReactNode;
  /** 初期 sort */
  defaultSort?: { key: string; order: "asc" | "desc" };
  /** caption (a11y) */
  caption?: string;
}

export function AdminTable<Row>(props: AdminTableProps<Row>): JSX.Element;
```

state ownership: 内部で `useState<{key, order}>` を保持。外部から制御する場合は `defaultSort` + `onSortChange` を将来追加 (本タスクでは uncontrolled のみ)。

### 2.6 AdminQueuePanel

責務: 左に list、右に detail。MQ-3-col 風だが本タスクでは **2-col layout** (list / detail)。

```ts
import type { ReactNode } from "react";

export interface AdminQueueItem {
  id: string;
  /** list 行に表示する node */
  listNode: ReactNode;
}

export interface AdminQueuePanelProps {
  items: AdminQueueItem[];
  /** 選択中 id (controlled) */
  selectedId: string | null;
  /** 選択変更 */
  onSelect: (id: string) => void;
  /** detail pane (selectedId に応じて切替) */
  detail: ReactNode;
  /** items が 0 件のとき左 pane に表示する fallback */
  emptyState?: ReactNode;
  /** list pane の見出し */
  listHeading?: string;
  /** detail pane の見出し */
  detailHeading?: string;
}

export function AdminQueuePanel(props: AdminQueuePanelProps): JSX.Element;
```

state ownership: **controlled** (selectedId / onSelect は外部)。`useState` は parent (TagsClientShell / RequestsClientShell 等) に置く。

### 2.7 barrel `index.ts`

```ts
export { AdminSectionCard } from "./AdminSectionCard";
export type { AdminSectionCardProps } from "./AdminSectionCard";
export { AdminSectionError } from "./AdminSectionError";
export type { AdminSectionErrorProps } from "./AdminSectionError";
export { AdminEmptyState } from "./AdminEmptyState";
export type { AdminEmptyStateProps } from "./AdminEmptyState";
export { AdminStat } from "./AdminStat";
export type { AdminStatProps } from "./AdminStat";
export { AdminTable } from "./AdminTable";
export type { AdminTableProps, AdminTableColumn } from "./AdminTable";
export { AdminQueuePanel } from "./AdminQueuePanel";
export type { AdminQueuePanelProps, AdminQueueItem } from "./AdminQueuePanel";
```

---

## 3. error 戦略

### 3.1 切替方針 (Before / After)

| 観点 | Before (現状) | After (本タスク) |
|------|---------------|------------------|
| 1 endpoint 失敗時 | `error.tsx` boundary で全画面エラー | 当該 section のみ `AdminSectionError` |
| `error.tsx` の役割 | 全 admin の汎用 boundary | **真の uncaught error 専用** (renderer crash / module load fail 等) |
| `loading.tsx` | 不変 | 不変 |
| `not-found.tsx` | 不変 | 不変 |

### 3.2 `AdminSectionError` の責務

- API error code を表示 (ユーザ向けに翻訳しない・原文)
- correlation ID を表示 (sentry / Cloudflare logs と突合可能に)
- retry ボタンは出さない (Phase 2 スコープ外)
- aria-live="polite" で screen reader 通知

### 3.3 server component への try-catch 適用方針

各 page.tsx で `Promise.allSettled` パターンを採用。

```tsx
// apps/web/app/(admin)/admin/page.tsx (改修後 sketch)
export default async function AdminDashboardPage() {
  const [dashboard, alerts, recent] = await Promise.all([
    safeServerFetch<AdminDashboardView>("/admin/dashboard"),
    safeServerFetch<SchemaAlerts>("/admin/schema/alerts"),
    safeServerFetch<RecentActions>("/admin/recent-actions"),
  ]);
  return (
    <>
      <AdminSectionCard title="KPI" id="kpi">
        {dashboard.ok ? <KpiGrid data={dashboard.data} /> : <AdminSectionError sectionLabel="KPI" {...dashboard.error} />}
      </AdminSectionCard>
      {/* ... 他 section も同様 */}
    </>
  );
}
```

### 3.4 `error.tsx` の再定義

メッセージを「予期しないエラーが発生しました。ページを再読み込みしてください。」に縮小。correlation ID と「管理画面トップへ」link のみ。各 admin route の本体は section degrade で吸収するため、`error.tsx` に到達するのは React render error / chunk load failure に限定。

---

## 4. state 引き渡しテーブル (Drawer / Modal / Queue selection)

| 用途 | owner | 渡し方 | 解放 |
|------|-------|--------|------|
| Members drawer (open / target member) | `MembersClientShell` | props 経由で `MemberDrawer` に渡す | `onOpenChange(false)` |
| Tags queue selection | 新規 `TagsClientShell` | `useState<string \| null>` を持ち `AdminQueuePanel` の `selectedId` / `onSelect` に渡す | `onSelect(null)` |
| Requests queue selection | 新規 `RequestsClientShell` | 同上 | 同上 |
| Identity conflicts row selection | 既存 `IdentityConflictRow` (row 単位) | row 内 toggle で local state | row unmount |
| Schema diff bulk resolve modal | `SchemaDiffPanel` | `useConfirmDialog` 経由 | `onClose` |
| Toast | `ToastProvider` (layout) | `useToast()` hook | auto-dismiss |
| Confirm dialog | `useConfirmDialog` hook (singleton) | hook 経由 | promise resolve |

---

## 5. data flow 図 (text)

```
[Cloudflare D1]
    │  (Workers binding, apps/api only)
    ▼
[apps/api/src/routes/admin/*]
    │  HTTP JSON
    ▼
[safeServerFetch<T>()]
    │  SafeResult<T>
    ▼
[server page.tsx]
    │  props (mapped)
    ▼
[AdminSectionCard]
    ├── ok=true  → 子 component (KpiGrid / MembersTable / AdminQueuePanel ...)
    └── ok=false → AdminSectionError
                       (correlationId, code を表示)
```

route → API path → response shape → mapper 関数名は §7 参照。

---

## 6. ライブラリ採用判断

**新規 dependency は追加しない**。次の既存資産のみ利用:

- React 19 server / client component
- Tailwind CSS (token は `tokens.css`)
- 既存 `@/components/ui/*` primitive
- 既存 `@/features/admin/hooks/{useAdminMutation,useConfirmDialog}`
- 既存 `@/lib/fetchAdmin`

icon は SVG 直書き (`AdminEmptyState` の 5 種は inline SVG)。`lucide-react` 等の追加は禁止。

---

## 7. 既存 endpoint との contract 表

| Route | API path | response 型 (apps/web 側) | mapper 関数 (新規) |
|-------|----------|---------------------------|-------------------|
| R1 `/admin` | `/admin/dashboard` | `AdminDashboardView` | (既存利用) |
| R1 `/admin` | `/admin/schema/alerts` | `SchemaAlerts` | `mapSchemaAlerts` (既存) |
| R1 `/admin` | `/admin/recent-actions` | `RecentAction[]` | (既存) |
| R2 `/admin/dashboard/attendance` | `/admin/dashboard/attendance` | `AttendanceSummary` | (既存) |
| R3 `/admin/members` | `/admin/members?...` | `MembersListView` | (既存) |
| R4 `/admin/tags` | `/admin/tags/queue` | `TagQueueItem[]` | `mapTagQueueToAdminQueueItems` (新規) |
| R5 `/admin/meetings` | `/admin/meetings` | `MeetingListView` | (既存) |
| R6 `/admin/meetings/[id]` | `/admin/meetings/:id` | `MeetingDetail` | (既存) |
| R7 `/admin/schema` | `/admin/schema/diff` | `SchemaDiffView` | (既存) |
| R8 `/admin/schema/history` | `/admin/schema/history` | `SchemaHistoryView` | (既存) |
| R9 `/admin/requests` | `/admin/requests/queue` | `RequestQueueItem[]` | `mapRequestQueueToAdminQueueItems` (新規) |
| R10 `/admin/identity-conflicts` | `/admin/identity-conflicts` | `IdentityConflictView` | (既存) |
| R11 `/admin/audit` | `/admin/audit?...` | `AuditLogView` | (既存) |

**新規 mapper は 2 関数のみ** (`mapTagQueueToAdminQueueItems`, `mapRequestQueueToAdminQueueItems`)。両者とも `_shared/queue-mappers.ts` に集約。

---

## 8. SubAgent / Lane 分割

| Lane | スコープ | 依存 |
|------|----------|------|
| Lane A | `_shared/` 6 component 実装 + barrel + helper + 各 spec | なし (最初) |
| Lane B | `app/(admin)/layout.tsx` + `error.tsx` + R1 page degrade | Lane A 完了後 |
| Lane C | R3 (members) + R4 (tags) page + Queue mapper + ClientShell | Lane A 完了後 (B と並列可) |
| Lane D | R5 (meetings) + R6 (meetings/[id]) + R7 (schema) + R8 (schema/history) | Lane A 完了後 (B と並列可) |
| Lane E | R2 (attendance) + R9 (requests) + R10 (identity) + R11 (audit) | Lane A 完了後 (B と並列可) |

Lane A は単独 SubAgent、B/C/D/E は完了後に並列実行可能 (各 SubAgent が異なる route subset を担当)。

---

## 9. 1 サイクル完了根拠

- Lane A: 6 component × 平均 80 行 + barrel + helper + spec 7 個 = 約 1 日
- Lane B: 1 layout + 1 error + 1 page degrade = 約 0.5 日
- Lane C/D/E: 各 4 route × 平均 100 行修正 + regression spec = 各 1 日 (並列 = 1 日)
- Phase 9-12: 0.5 日

合計 約 3 日。設計・実装・検証を 5 日以内に収める前提で Lane を切る。

---

## 10. 命名規則統一

| 種別 | 規則 | 例 |
|------|------|-----|
| 新規 component file | `Admin<Noun>.tsx` (PascalCase) | `AdminSectionCard.tsx` |
| 新規 spec | 同名 `.spec.tsx` | `AdminSectionCard.spec.tsx` |
| 新規 mapper file | `<noun>-mappers.ts` (kebab-case) | `queue-mappers.ts` |
| 新規 ClientShell | `<Route>ClientShell.tsx` | `TagsClientShell.tsx`, `RequestsClientShell.tsx` |
| Props 型 | `<Component>Props` interface | `AdminTableProps` |
| 型 (item) | `<Component>Item` interface | `AdminQueueItem` |
| barrel | `index.ts` | `_shared/index.ts` |

---

## 11. FB-SDK-07-2 / FB-SDK-07-4 対応 (既存 API 命名パターン確認)

## メタ情報

- task_id: `admin-ui-prototype-alignment`
- Phase: 2
- workflow_state: `implemented_local_runtime_pending`

## 目的

Admin UI alignment の component contract、server/client 境界、degrade 方針を設計する。

## 実行タスク

- `_shared` 6 component の props と責務を固定する
- `safeServerFetch` と `SafeResult` を fetch helper の正本名として固定する
- Lane A〜E の依存順を定義する

## 参照資料

- `phase-1-requirements.md`
- `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md`
- `docs/00-getting-started-manual/claude-design-prototype/primitives.jsx`

## 成果物/実行手順

- 本設計を Phase 4 test plan と Phase 5 implementation の入力にする
- retry button は v1 では出さず、page reload 導線に統一する

## 統合テスト連携

- props-driven component contract を Phase 4 の TC-SC/SE/ES/ST/TB/QP へ対応させる

## 完了条件

- [ ] component API / helper 名 / state 境界 / route lane が Phase 4・5 と一致している

調査結果:

| 観点 | 確認内容 | 採用 |
|------|----------|------|
| fetch ラッパー | `apps/web/src/lib/fetchAdmin.ts` (camelCase function name) | `safeServerFetch` も camelCase で踏襲 |
| Result 型 | 既存 `Result<T, E>` は未導入 (新規) | `SafeResult<T>` を `apps/web/src/lib/result.ts` に新設 |
| Error 正規化 | `apps/web/src/lib/api-errors.ts` (`normalizeApiError`) 既存 | そのまま `safeServerFetch` から呼ぶ |
| section component の prop 名 | 既存 `_dashboard/*` は `data: T` で受ける | `AdminSectionCard` は presentation 専用なので data prop は持たない |
| Queue panel の selection prop | 既存 `useConfirmDialog` は controlled (`open` / `onOpenChange`) | `AdminQueuePanel` も controlled (`selectedId` / `onSelect`) で統一 |

→ 新規 API surface (`SafeResult`, `safeServerFetch`) は既存命名規則と整合。
