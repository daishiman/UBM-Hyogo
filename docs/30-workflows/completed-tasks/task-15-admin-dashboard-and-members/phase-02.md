# Phase 2: 設計

[実装区分: 実装仕様書]

> 目的: コンポーネント topology / API client / state ownership / a11y 契約を固定し、Phase 4-5 で TDD と実装が迷わずに進む状態にする。

---

## 1. 既存コンポーネント再利用可否（FB-SDK-07-1）

| 既存資産 | 採否 | 理由 |
|---------|------|------|
| `apps/web/src/components/ui/{button,card,badge,input,select,skeleton,drawer}` (task-10) | **採用** | task-10 で primitive 11 種が完成済み。新規 primitive を生やさない |
| `apps/web/src/components/layout/AdminSidebar.tsx` | **再利用のみ（編集禁止）** | 8 nav 既存配列を踏襲 |
| `apps/web/src/lib/session.ts` + `(admin)/layout.tsx` guard | **再利用・強化** | server guard を新設せず既存 `getSession()` + redirect を維持 |
| `apps/web/src/lib/admin/server-fetch.ts` / `app/api/admin/[...path]/route.ts` | **再利用・強化** | Server Component fetch と client mutation proxy の正本 |
| `recharts` ライブラリ | **不採用** | バーチャートは軽量 SVG 自前実装で十分（依存追加コスト > 価値）。`recharts` SSR 互換性も Phase 9 で再確認不要に |
| `apps/web/src/components/admin/MembersClient.tsx`（旧実装） | **置換対象** | `features/admin/components/_members/` に再構成し、Phase 8 で旧 dir 削除 |

---

## 2. コンポーネント topology

### 2.1 `/admin` ツリー

```
(admin)/admin/page.tsx [Server]
└── AdminPageHeader
└── SchemaAlertCard?  (totals.unresolvedSchema > 0 のみ)
└── KpiGrid
    └── KpiCard × 4 (total / public / untagged / schema)
└── grid-2
    ├── ZoneDistribution
    └── Suspense → RecentActionsTable
└── StatusDistribution
```

### 2.2 `/admin/members` ツリー

```
(admin)/admin/members/page.tsx [Server, fetch initial]
└── AdminPageHeader (actions: CSV エクスポート disabled)
└── MembersClientShell ["use client"]
    ├── MembersFilters         (q / zone / filter / sort)
    ├── BulkActionBar          (selected.length > 0 で出現)
    ├── MembersTable           (items / pagination / row select / row click)
    └── MemberDrawer?          (openMemberId !== null のみマウント)
```

### 2.3 `(admin)/layout.tsx` 構成

```
AdminLayout (RSC, async)
├── await requireAdmin()  // 401 → redirect("/login?from=/admin")
└── grid-cols-[240px_1fr]
    ├── <aside> AdminSidebar  (8 nav 既存)
    └── <main>  {children}
```

`export const dynamic = "force-dynamic"` を layout / 両 page に付与。

---

## 3. State ownership / 引き渡しテーブル（FB-W1-02b-2）

| state | 所有者 | 初期値 | 更新トリガ | 引き渡し先 |
|------|--------|--------|----------|-----------|
| `selected: Set<string>` | `MembersClientShell` | `new Set()` | row checkbox toggle / BulkActionBar onComplete | `MembersTable` (`selected`, `onToggleSelect`) / `BulkActionBar` (`selectedIds`) |
| `openMemberId: string \| null` | `MembersClientShell` | `null` | row 氏名/詳細 click / `MemberDrawer.onClose` | `MemberDrawer` (`memberId`) |
| URLSearchParams (`q` / `zone` / `filter` / `sort` / `page`) | URL（Next.js） | server SSR 時に `searchParams` から | `MembersFilters.onChange` → `router.replace` | `MembersFilters` (`value` 経由 props down) |
| `pending: boolean` | `useTransition` | `false` | filter 変更 → `startTransition` | `MembersFilters` (`loading`) |
| `data: AdminMemberDetailView \| null` | `MemberDrawer` (local) | `null` | `useEffect([memberId])` で `/api/admin/members/:memberId` または既存 helper を呼ぶ | drawer body 描画 |

**ロック変数の解放経路（FB-STATE-DETAIL-01）**:

`BulkActionBar` の `busy: Action | null` は `try { ... } finally { setBusy(null) }` で解放。正常完了 / 例外 / unmount どの経路でも null に戻すこと。

**props 変更時の再同期（FB-STATE-DETAIL-03）**:

`MemberDrawer` は `memberId` prop 変更を `useEffect` 依存配列で監視し、cancelled flag で stale 防止する（元仕様 §5.7 のパターン踏襲）。

---

## 4. API client 設計（`apps/web/src/lib/admin/*`）

### 4.1 シグネチャ

```ts
// Server Component read path
export async function fetchAdmin<T>(path: string, opts?: AdminFetchOptions): Promise<T>;

// Client mutation path via /api/admin/* proxy
export const patchMemberStatus: (
  memberId: string,
  body: { publishState?: "public" | "member_only" | "hidden"; hiddenReason?: string | null }
) => Promise<AdminMutationResult>;
export const deleteMember: (memberId: string, reason: string) => Promise<AdminMutationResult>;
export const restoreMember: (memberId: string) => Promise<AdminMutationResult>;

// Read examples
fetchAdmin<AdminDashboardView>("/admin/dashboard");
fetchAdmin<AdminMemberListView>("/admin/members?filter=published&page=1");
fetchAdmin<AdminMemberDetailView>("/admin/members/<memberId>");
```

### 4.2 後続 task との衝突回避（元仕様 §0.10）

既存 `apps/web/src/lib/admin/api.ts` へ **関数追加のみ**。task-16 が `tags / meetings / requests`、task-17 が `schema / identityConflicts / audit` を追記する前提で、本 task は `patchMemberStatus` / `deleteMember` / `restoreMember` の契約維持と dashboard / members read path の `fetchAdmin<T>()` 利用を固定する。flatten な `adminClient.*` object は新設しない。

### 4.3 zod schema（`admin-types.ts`）

| 型 | 出所 | 拡張 |
|------|------|------|
| `AdminDashboardViewZ` | `@ubm-hyogo/shared` | 現行 schema は `totals` / `recentActions` / `generatedAt` のみ。`byZone` / `byStatus` は web local mapper で optional placeholder 判定 |
| `AdminMemberListViewZ` | `@ubm-hyogo/shared` | `total` / `members` / optional `page` / `pageSize` をそのまま使用 |
| `AdminMemberDetailViewZ` | `@ubm-hyogo/shared` | そのまま |

**`shared` package には触らない**（FB-W0-01: shared root barrel に再 export しない）。UI 拡張は `apps/web/src/lib/admin/admin-dashboard-ui.ts` に閉じる。

### 4.4 エラーハンドリング

各メソッドは `if (!res.ok) throw new Error(\`<path> ${res.status}\`)` でシンプルに throw。Drawer / page で `try/catch` または error boundary で受ける。

---

## 5. UI 契約（プロトタイプ反映 + 派生ルール）

### 5.1 `pages-admin.jsx` からの差分（元仕様 §7）

| 派生要素 | 由来 | 本実装での扱い |
|---------|------|---------------|
| dashboard `RecentActions` | プロトタイプは "最近の支部会と出席" | API response (`recentActions` = audit log) に置換、UI 構造（左 date / 右 description）を踏襲 |
| dashboard `byZone` / `byStatus` | プロトタイプは MEMBERS から計算 | API 未提供時は placeholder を描画し、追加 endpoint なし。DoD では「分布 chart 実データ」ではなく「placeholder または optional データの一貫表示」を判定 |
| members `BulkActionBar` | プロトタイプ単独 row 操作のみ | 既存 `/admin/member-status` `/admin/member-delete` シリアル呼出を adapter に閉じる |
| `MemberDrawer` audit log セクション | プロトタイプ無し | detail endpoint が `audit` を含むため再利用 |
| `(admin)/layout.tsx` grid | プロトタイプ 2 カラム | 240px sidebar 固定、sm 以下では sidebar `hidden` + `Drawer` 化 |

### 5.2 a11y / role 契約（元仕様 §0.12）

| コンポーネント | 必須 a11y |
|---------------|----------|
| `<table>` | `<caption class="sr-only">`、`<th scope="col">` 必須 |
| row click | `<button>` で wrap、`<tr onClick>` 単独禁止 |
| `MemberDrawer` | `role="dialog"` + `aria-labelledby` + ESC 閉じ + focus trap |
| `BulkActionBar` | `role="region"` + `aria-label="一括操作"` + `aria-live="polite"` で件数表示 |
| `ZoneDistribution` バー | `role="img" aria-label="zone 別人数 ... 最大は ... M 件"` |
| icon-only button (× / checkbox) | `aria-label` 必須 |
| Tooltip "Coming soon" | `aria-disabled="true"` + Radix Tooltip |

### 5.3 z-index 階層（元仕様 §0.13）

`z-banner < z-bulkbar (z-30) < z-drawer (z-40) < z-modal (z-50)` を tokens で定義。

### 5.4 Filter / Sort / Pagination 仕様

- Filter: `q` (free text, onBlur で確定) / `zone` (Select) / `filter` (Select: published/hidden/deleted) / `sort` (Select: recent/name/publish_state)
- Sort: client state ではなく URL `sort` query → server fetch
- Pagination: pageSize=50 固定、`page` query で表示中ページ
- filter 変更時は `page` を delete（reset）

### 5.5 BulkAction 仕様

| action | 実装 |
|--------|------|
| `publish` | `selectedIds` をシリアルに `patchMemberStatus(id, { publishState: "public" })` |
| `hide` | 同上、`publishState: "hidden"` |
| `soft-delete` | `deleteMember(id, reason)` をシリアル（API body は `{ reason: string }` 必須） |
| `restore` | 必要時のみ `restoreMember(id)`（論理削除済み member の Undo） |

完了後 `router.refresh()` で SSR 再フェッチ + selection clear。

---

## 6. ライブラリ選定（複合フィールド検証 — FB-CRONVL-001 流用）

| 候補 | 採否 | 理由 |
|------|------|------|
| `recharts` | 不採用 | バーチャート 1 種のみで依存コスト過大、SSR 設定追加が必要 |
| 自前 SVG | 採用 | `<div>` + `width: ${(count/total)*100}%` で十分、a11y 制御が容易 |
| `@radix-ui/react-tooltip` (task-10) | 採用 | "Coming soon" tooltip に使用 |
| `@radix-ui/react-dialog` (task-10 Drawer) | 採用 | MemberDrawer の base |

---

## 7. wave 分割と layout merge ゲート（元仕様 §0.11）

| Wave | 内容 | 並列性 |
|------|------|-------|
| W1 | `lib/api/admin.ts` base client + `admin-types.ts` schema | 単独 |
| W2 | `_dashboard/*` 6 component | _members lane と並列 |
| W3 | `_members/*` 5 component + `src/lib/admin/api.ts` mutation helper 接続 | _dashboard lane と並列 |
| W4 | page.tsx 2 ファイルの SSR 確定 | W2/W3 後 |
| **W5** | `(admin)/layout.tsx` 確定 + dev 反映 | task-16/17 着手 gate |
| W6 | vitest / jest-axe / 手動 smoke | task-18 引き継ぎ |

**重要**: layout merge 前に task-16/17 が `(admin)/layout.tsx` に触れると merge conflict 確定。

---

## 8. 想定エラーパターンと対処（元仕様 §0.13）

| 症状 | 想定原因 | 対処 |
|------|---------|------|
| dashboard 401 | `requireAdmin` 未マージ / cookie 切れ | layout guard 確認、`/login?from=/admin` redirect |
| members 空 | API filter too strict / cursor 不整合 | FilterBar reset、`q` 空文字を送らない |
| Drawer 開かない | row click が `<a>` と競合 | row 全体を `<button>` 化、Link 列で `e.stopPropagation()` |
| HEX 直書き fail | utility hardcode | `bg-[#...]` を `bg-[var(--ubm-color-*)]` に置換 |
| Recent Actions 遷移先無効 | task-17 audit page 未マージ | 一時的に Link `disabled`、task-17 完了後に有効化 |
| BulkActionBar が他画面に滲む | layout z-index 管理 | 上記 5.3 階層を tokens で定義、z-30 固定 |

---

## 9. セキュリティ前提（元仕様 §0.15）

- `requireAdmin` server guard を `(admin)/layout.tsx` 冒頭で必ず呼ぶ
- state-changing endpoint は API 側 `Origin` チェック済み、client は `credentials: "include"`
- PII 表示は masked（`a***@example.com` / `090-****-1234`）
- 詳細 drawer の Copy button は audit log に actor 記録（API 側既存挙動）

---

## 10. 完了条件

- [ ] §2 topology が Phase 4-5 の入力として確定
- [ ] §3 state 引き渡しテーブルが完成
- [ ] §4 API client シグネチャと衝突回避ルールが固定
- [ ] §5 a11y / role 契約が確定
- [ ] §7 wave 分割と layout merge gate が明示
- [ ] `outputs/phase-02/design.md` 生成

## 成果物

- `outputs/phase-02/design.md`（topology / state ownership / API client / a11y 契約）
- 実行後に `artifacts.json` の `phase02.status` を `completed` へ更新（仕様書作成時点は `spec_created`）
