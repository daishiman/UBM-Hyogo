---
実装区分: 実装仕様書
Phase: 5
状態: completed
task_id: admin-ui-task-d-attendance-primitive-conformance
親: [index.md](./index.md)
前: [phase-4-test-plan.md](./phase-4-test-plan.md)
次: [phase-6-test-additions.md](./phase-6-test-additions.md)
---

# Phase 5: 実装手順

## 5.1 変更対象ファイル一覧

| ファイル | 操作 | 主旨 |
|---------|------|------|
| `apps/web/app/(admin)/admin/dashboard/attendance/page.tsx` | 編集（書き換え） | fetch owner + AdminPageHeader + client island 呼び出し |
| `apps/web/app/(admin)/admin/dashboard/attendance/AttendanceDashboardSections.client.tsx` | 新規 | inline KpiCard 削除 / 裸 table → AdminTable / KpiCard 採用 |
| `apps/web/app/(admin)/admin/dashboard/attendance/__tests__/page.spec.tsx` | 新規 | T-D-01..D-04 |
| `apps/web/src/features/admin/components/_attendance/AttendanceRateBar.tsx` | **作成しない** | Phase 2.4 判定により不採用 |
| `apps/api/src/routes/admin/dashboard.ts` | 編集しない | AC-D6 維持 |

## 5.2 関数シグネチャ / module-local 定義

`AttendanceDashboardSections.client.tsx` 内に module-local として保持:

```ts
const fmtPct = (rate: number): string => `${(rate * 100).toFixed(1)}%`;

function toBySessionColumns(): AdminTableColumn<SessionAttendanceRow>[] { /* Phase 2.3 */ }
function toRankingColumns():   AdminTableColumn<MemberAttendanceRanking>[] { /* Phase 2.3 */ }
function toneForRate(rate: number): KpiTone {
  if (rate >= 0.7) return "success";
  if (rate >= 0.5) return "warning";
  return "danger";
}
```

専用 mapper ファイルへの分離は行わない（単一画面の局所複雑度に閉じる）。

## 5.3 import 差分

```ts
import { AdminPageHeader } from "../../../../../src/features/admin/components";
import { AttendanceDashboardSections } from "./AttendanceDashboardSections.client";

// AttendanceDashboardSections.client.tsx
import {
  AdminEmptyState,
  AdminSectionErrorClient,
  AdminTable,
  KpiCard,
  type AdminTableColumn,
  type KpiTone,
} from "../../../../../src/features/admin/components";
```

## 5.4 差分方針（行範囲は現行ソース基準）

- L4-5 の import に `AdminPageHeader` と `AttendanceDashboardSections` を追加し、`AdminSectionErrorClient` 直接利用は client island へ移す
- L44-45 の `<section>` + `<h1>` を `AdminPageHeader` に置換。page root は `aria-label="出席分析"` を持つ
- L47-125 KPI / by-session / ranking 描画を `AttendanceDashboardSections` へ移す
- `AttendanceDashboardSections.client.tsx` で KpiCard 3 枚、AdminTable 2 個、AdminSectionErrorClient の 3 区画 fail-soft を実装
- L131-144 inline `function KpiCard` を **削除**

## 5.5 入出力 / 副作用

- 入力: `safeServerFetch` で 3 endpoint 並列取得（既存と同一 URL / shape）
- 出力: JSX。data 副作用なし
- エラー: 各 endpoint 単位で `ok: false` → 該当 region に AdminSectionErrorClient、他 region は描画継続（fail-soft 維持）

## 5.6 ローカル実行 / 検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test -- attendance-page
mise exec -- pnpm --filter @ubm-hyogo/web dev   # /admin/dashboard/attendance を手動確認
```

## 5.7 DoD（Phase 5 限定）

- [ ] 上記 5.4 の 6 ブロックがすべて書き換え済み
- [ ] inline `function KpiCard` が物理的に削除されている
- [ ] `<table` 文字列が page.tsx 内に 0 件
- [ ] `apps/api/src/routes/admin/dashboard.ts` の diff = 0 行
- [ ] typecheck / lint green

## メタ情報

| 項目 | 内容 |
|------|------|
| Phase | 5 |
| 実装状態 | implementation_complete_pending_pr |

## 目的

実装者が迷わない変更ファイル、境界、検証コマンドを固定する。

## 実行タスク

- `page.tsx` を fetch owner に縮小する。
- `AttendanceDashboardSections.client.tsx` を新設する。
- focused spec を追加する。

## 参照資料

| 参照資料 | パス | 内容 |
|----------|------|------|
| components barrel | `apps/web/src/features/admin/components/index.ts` | import 正本 |

## 成果物

| 成果物 | パス | 内容 |
|--------|------|------|
| implementation target | `apps/web/app/(admin)/admin/dashboard/attendance/page.tsx` | Server Component |
| client island | `apps/web/app/(admin)/admin/dashboard/attendance/AttendanceDashboardSections.client.tsx` | Client Component |

## 完了条件

- [ ] `AdminTable` の function props が client island 内にある。
