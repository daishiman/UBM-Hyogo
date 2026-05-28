---
spec_classification: implementation_spec
state: spec_created
phase: 1
phase_name: 要件定義
created_at: 2026-05-23
task_type: UI task
visual_category: VISUAL
implementation_mode: new (+ verify_existing for Dashboard / Members / Schema)
workflow: docs/30-workflows/admin-ui-prototype-alignment/
---

# Phase 1: 要件定義

## 1. ゴール (3 個)

1. **G1 (画面復旧)**: staging で全画面エラー化している `/admin` 配下 11 route を、サーバ fetch 失敗があってもページ全体は 200 でレンダリングされ、失敗 section のみが `AdminSectionError` に degrade する状態にする。
2. **G2 (プロトタイプ整合)**: `claude-design-prototype/pages-admin.jsx` の主要 4 画面 (Dashboard / Members / Tags / Schema) と、派生 4 画面 (Meetings / Requests / Identity-Conflicts / Audit) のレイアウト・spacing・tone をプロトタイプ正本に揃える。
3. **G3 (共通化)**: 11 route 横断で重複する shell / page header / kpi / table / queue / drawer / empty-state / error-state を `apps/web/src/features/admin/components/_shared/` 配下 6 component + barrel + helper に集約し、`apps/web/src/components/admin/*.tsx` から段階的に置換する。

> 非ゴール: 新規 API 追加・D1 schema 変更・auth middleware 改修・新 endpoint contract 定義。

---

## 2. 対象 route 一覧 (11 route)

| # | Route | プロトタイプ正本 | 既存実装ファイル | 作業区分 |
|---|-------|------------------|------------------|----------|
| R1 | `/admin` | `AdminDashboardPage` L4-159 | `apps/web/app/(admin)/admin/page.tsx` | `verify_existing` (error degrade 追加) |
| R2 | `/admin/dashboard/attendance` | (派生) | `apps/web/app/(admin)/admin/dashboard/attendance/page.tsx` | `new` (整合修正) |
| R3 | `/admin/members` | `AdminMembersPage` L162-366 | `apps/web/app/(admin)/admin/members/page.tsx` | `verify_existing` |
| R4 | `/admin/tags` | `AdminTagsPage` L369-505 | `apps/web/app/(admin)/admin/tags/page.tsx` | `new` (Queue 統合) |
| R5 | `/admin/meetings` | GAS prototype 参考 | `apps/web/app/(admin)/admin/meetings/page.tsx` | `new` |
| R6 | `/admin/meetings/[id]` | 派生 | `apps/web/app/(admin)/admin/meetings/[id]/page.tsx` | `new` |
| R7 | `/admin/schema` | `SchemaDiffPage` L508-656 | `apps/web/app/(admin)/admin/schema/page.tsx` | `verify_existing` |
| R8 | `/admin/schema/history` | (派生) | `apps/web/app/(admin)/admin/schema/history/page.tsx` | `new` |
| R9 | `/admin/requests` | (派生) | `apps/web/app/(admin)/admin/requests/page.tsx` | `new` (Queue 統合) |
| R10 | `/admin/identity-conflicts` | (派生) | `apps/web/app/(admin)/admin/identity-conflicts/page.tsx` | `new` (Queue 統合) |
| R11 | `/admin/audit` | (派生) | `apps/web/app/(admin)/admin/audit/page.tsx` | `new` |

横断: `apps/web/app/(admin)/layout.tsx` / `error.tsx` / `loading.tsx` / `not-found.tsx`。

---

## 3. 既存コードの命名規則分析

| 種別 | 規則 | 適用先 | 例 |
|------|------|--------|-----|
| ファイル (Component) | `PascalCase.tsx` | `apps/web/src/components/admin/`, `features/admin/components/` | `MemberDrawer.tsx`, `TagQueuePanel.tsx` |
| ファイル (Hook) | `useXxx.ts` | `features/admin/hooks/` | `useAdminMutation.ts` |
| ファイル (Route) | `kebab-case/` + `page.tsx` | `apps/web/app/(admin)/admin/` | `identity-conflicts/page.tsx` |
| Component export | `PascalCase` named export | 全 component | `export function MemberDrawer()` |
| Props 型 | `XxxProps` interface | 全 component | `interface MemberDrawerProps` |
| Barrel | `index.ts` | feature subgroup | `_dashboard/`, `_members/` |

→ **新規 6 component + barrel + helper も同じ規則を踏襲**。`_shared/` 直下に `PascalCase.tsx` + `*.spec.tsx`、barrel `index.ts`。

---

## 4. P50 チェック表

| # | チェック項目 | 結果 | 根拠 |
|---|--------------|------|------|
| P50-1 | current branch に対象 dir が存在 | YES | `apps/web/src/features/admin/components/_layout/_dashboard/_members/` 既存 |
| P50-2 | `_shared/` dir は未作成 | YES | `ls apps/web/src/features/admin/components/_shared 2>/dev/null` 空 |
| P50-3 | upstream `dev` に同名 dir なし (drift 無) | YES | parent workflow `ui-prototype-alignment-mvp-recovery` は completed |
| P50-4 | 前提タスク (task-15/16/17) は completed | YES | `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/07-screens-admin/` 配下に 3 task |
| P50-5 | OKLch token は `tokens.css` に存在 | YES | task-09 で導入済 (`--ubm-color-*` 80+ 行) |
| P50-6 | `verify-design-tokens` CI gate 稼働中 | YES | task-18 で導入済 |
| P50-7 | 既存 endpoint 一覧把握済 | YES | `apps/api/src/routes/admin/**` |
| P50-8 | `FormField` / `useAdminMutation` 流用可 | YES | 不変条件 #9 #10 |

→ 全 PASS。Phase 2 着手可能。

---

## 5. implementation_mode 区分

| Mode | route | 内容 |
|------|-------|------|
| `verify_existing` | R1, R3, R7 | 既存実装 (task-15 / task-17) と spec の drift を verify、共通 component 抽出で再構成 |
| `new` | R2, R4, R5, R6, R8, R9, R10, R11 | 共通 component を前提に layout を再構築 |

> `new` モードでも、既存の per-page state ロジック (sort / filter / drawer state) は流用する。layout のみ刷新。

---

## 6. inventory: 流用可 / 改修必要 / 新規

### 6.1 流用可 (変更禁止)

| 区分 | パス | 用途 |
|------|------|------|
| primitive | `apps/web/src/components/ui/{Card,Button,Badge,FormField,Drawer,Toast,Input,Select,Switch,Segmented,KVList}.tsx` | 全 admin 画面 |
| hook | `apps/web/src/features/admin/hooks/useAdminMutation.ts` | mutation 全般 (不変条件 #10) |
| hook | `apps/web/src/features/admin/hooks/useConfirmDialog.ts` | 確認 modal |
| layout | `apps/web/src/features/admin/components/_layout/AdminPageHeader.tsx` | 各 page header |
| dashboard | `_dashboard/{KpiCard,KpiGrid,ZoneDistribution,StatusDistribution,RecentActionsTable,SchemaAlertCard}.tsx` | R1 |
| members | `_members/{MembersClientShell,MembersFilters,MembersTable,BulkActionBar,MemberDrawer}.tsx` | R3 |

### 6.2 改修必要

| ファイル | 改修内容 |
|----------|----------|
| `apps/web/app/(admin)/layout.tsx` | sidebar shell とプロトタイプの spacing 整合 |
| `apps/web/app/(admin)/admin/error.tsx` | 「画面全体エラー」→「真の boundary 専用」へ再定義、メッセージ縮小 |
| `apps/web/app/(admin)/admin/page.tsx` | `fetchAdmin` を try-catch 化、失敗時 `AdminSectionError` に degrade |
| 全 R2-R11 の `page.tsx` | 同上の degrade パターン適用 |
| `apps/web/src/components/admin/{AuditLogPanel,Breadcrumb,MeetingPanel,RequestQueuePanel,SchemaDiffPanel,SchemaDiffHistoryPanel,TagQueuePanel,TagsQueueResolveDrawer,IdentityConflictRow,SchemaDiffBulkResolveModal}.tsx` | `AdminSectionCard` / `AdminTable` / `AdminQueuePanel` で wrap・置換 |

### 6.3 新規 (7 file + spec)

| ファイル | 責務 |
|----------|------|
| `_shared/AdminSectionCard.tsx` | Card wrapper + heading + actions slot |
| `_shared/AdminSectionError.tsx` | per-section error degrade UI |
| `_shared/AdminEmptyState.tsx` | empty illustration + message + cta |
| `_shared/AdminStat.tsx` | KPI 数値表示 (KpiCard との関係は Phase 2 で整理) |
| `_shared/AdminTable.tsx` | table + sort + sticky header |
| `_shared/AdminQueuePanel.tsx` | 左 list + 右 detail の queue 処理 layout |
| `_shared/index.ts` | barrel |

---

## 7. プロトタイプ vs 実装の主要 gap (7 件)

| # | gap | プロトタイプ参照 | 現状 | 影響 route |
|---|-----|------------------|------|-----------|
| GAP-1 | fetch 失敗時に画面全体 error 化 | (該当なし: client-only prototype) | `apps/web/app/(admin)/admin/page.tsx` L5 で throw → `error.tsx` L1-67 全画面 | R1 (実害), R2-R11 (潜在) |
| GAP-2 | section card の heading + actions slot | `pages-admin.jsx` L18-31 `<section className="card">` 反復 | 各 page が `<section>` を手書き、heading 構造が drift | 全 route |
| GAP-3 | KPI grid spacing | `pages-admin.jsx` L34-44 `grid-cols-4` + `gap-3` | `KpiGrid` の gap が drift | R1 |
| GAP-4 | Queue layout (左 list + 右 detail) | `pages-admin.jsx` L369-505 (Tags) | `TagQueuePanel` / `RequestQueuePanel` がそれぞれ独自 layout | R4, R9, R10 |
| GAP-5 | Table sticky header + sort affordance | `pages-admin.jsx` L208-272 (Members table) | `MembersTable` のみ実装、他 table は plain | R3 (OK), R5, R11 (gap) |
| GAP-6 | Empty state illustration + CTA | `primitives.jsx` (Drawer 内部) | 各 panel が `if (!data) return null` で空白返却 | R4, R5, R9, R10, R11 |
| GAP-7 | OKLch tone via `zoneTone` / `statusTone` | `primitives.jsx` L150-180 | 一部 component で `bg-[#xxx]` の名残 | 全 route (verify-design-tokens で検出) |

---

## 8. 受入条件 (Phase 1 で固定)

1. 11 route の `implementation_mode` 区分が表 5 で固定済み。
2. 7 個の新規 component の責務が表 6.3 で固定済み (Props 詳細は Phase 2)。
3. GAP リスト (7 件) が個別 acceptance に解消されること。具体 acceptance は Phase 2 design table と紐付ける。
4. 全 route で `fetchAdmin` 失敗が global error boundary に届かないこと (Phase 2 で error 戦略確定)。
5. `verify-design-tokens` CI gate を pass すること (HEX 直書き 0 件)。

---

## 9. リスク・前提

| 区分 | 内容 | 軽減策 |
|------|------|--------|
| リスク | 共通 component 抽出による既存 task-15/16/17 出力との drift | Phase 8 リファクタで段階置換、Phase 9 で `pnpm test` 確認 |
| リスク | per-section degrade 導入で `Suspense` 境界が増え bundle 増 | client component 化を最小化、`AdminSectionError` は server component で実装 |
| リスク | プロトタイプ未掲載画面 (R2, R5-R6, R8-R11) で primitive 不足 | 新 primitive は生やさず既存 `_shared/` で吸収 (不変条件 #3) |
| 前提 | 既存 API endpoint surface は変更しない | 不変条件 #1 |
| 前提 | OKLch token (`--ubm-color-*`) は task-09 で確定済 | `tokens.css` 既存値は変更禁止、追加のみ可 |
| 前提 | Auth middleware (`apps/web/middleware.ts`) の動作は本タスクで変更しない | middleware が先に redirect する場合を除き、認証起因の 401 は per-section error として表示する |

---

## 10. タスク分類 (Feedback 3 対応)

- **task type**: `UI task`
- **visual evidence**: `VISUAL` (Phase 11 で screenshot 必須)
- **implementation_mode**: `new` (一部 `verify_existing` あり、artifacts.json では top-level `new` を採用)
- **spec classification**: `implementation_spec` (docs-only 例外なし)

---

## 11. Phase 4 で targeted vitest 対象になるテストファイル候補 (FB-UI-02-2)

## メタ情報

- task_id: `admin-ui-prototype-alignment`
- Phase: 1
- workflow_state: `implemented_local_runtime_pending`

## 目的

Admin UI alignment の要件、対象 route、既存資産、受入条件を固定する。

## 実行タスク

- 対象 11 route と implementation mode を確定する
- `_shared` 6 component + barrel + helper の導入範囲を確定する
- API / D1 / auth 仕様変更なしの境界を固定する

## 参照資料

- `index.md`
- `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md`
- `docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx`

## 成果物/実行手順

- 本ファイルの route inventory / gap / AC を Phase 2 以降の入力にする
- `artifacts.json.metadata.taskType=implementation` と `visualEvidence=VISUAL` を維持する

## 統合テスト連携

- Phase 4 で `_shared` component specs、`safeServerFetch` specs、page degrade specs へ展開する

## 完了条件

- [ ] 対象 route / 不変条件 / 受入条件 / テスト候補が矛盾なく定義されている

新規 spec (7 個):

```
apps/web/src/features/admin/components/_shared/AdminSectionCard.spec.tsx
apps/web/src/features/admin/components/_shared/AdminSectionError.spec.tsx
apps/web/src/features/admin/components/_shared/AdminEmptyState.spec.tsx
apps/web/src/features/admin/components/_shared/AdminStat.spec.tsx
apps/web/src/features/admin/components/_shared/AdminTable.spec.tsx
apps/web/src/features/admin/components/_shared/AdminQueuePanel.spec.tsx
apps/web/src/features/admin/components/_shared/index.spec.ts
```

既存 regression 対象 (差し替え影響):

```
apps/web/src/components/admin/AuditLogPanel.spec.tsx
apps/web/src/components/admin/MeetingPanel.spec.tsx
apps/web/src/components/admin/RequestQueuePanel.spec.tsx
apps/web/src/components/admin/SchemaDiffPanel.spec.tsx
apps/web/src/components/admin/SchemaDiffHistoryPanel.spec.tsx
apps/web/src/components/admin/TagQueuePanel.spec.tsx
apps/web/src/components/admin/TagsQueueResolveDrawer.spec.tsx
apps/web/src/components/admin/IdentityConflictRow.spec.tsx
apps/web/src/components/admin/SchemaDiffBulkResolveModal.spec.tsx
apps/web/src/features/admin/components/_dashboard/KpiCard.spec.tsx
apps/web/src/features/admin/components/_members/MembersTable.spec.tsx
```

route-level integration (smoke):

```
apps/web/app/(admin)/admin/page.spec.tsx
apps/web/app/(admin)/admin/members/page.spec.tsx
apps/web/app/(admin)/admin/tags/page.spec.tsx
apps/web/app/(admin)/admin/schema/page.spec.tsx
```

Playwright (Phase 11):

```
apps/web/tests/e2e/admin-degrade.spec.ts (新規)
apps/web/tests/e2e/admin-visual.spec.ts (新規)
```

→ Phase 4 で targeted vitest 起動コマンド (`pnpm --filter @ubm-hyogo/web test -- <files>`) に渡す。
