---
実装区分: 実装仕様書
Phase: 6
状態: completed
task_id: admin-ui-task-d-attendance-primitive-conformance
親: [index.md](./index.md)
前: [phase-5-implementation.md](./phase-5-implementation.md)
次: [phase-7-coverage.md](./phase-7-coverage.md)
---

# Phase 6: テスト追加

新規 spec: `apps/web/app/(admin)/admin/dashboard/attendance/__tests__/page.spec.tsx`

## 6.1 T-D-01 snapshot (3 region testid)

```ts
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../../../src/lib/admin/safe-server-fetch", () => ({
  safeServerFetch: vi.fn(),
}));

describe("attendance dashboard page", () => {
  it("renders 3 testid regions when all endpoints ok", async () => {
    // arrange: safeServerFetch を 3 endpoint 分 ok fixture で順次返す
    // act: const tree = render(await AdminAttendanceDashboardPage())
    // assert:
    //   getByTestId("attendance-overview")
    //   getByTestId("attendance-by-session")
    //   getByTestId("attendance-ranking")
  });
});
```

## 6.2 T-D-02 a11y

- `getByRole("region", { name: "出席分析" })` または同等の page root accessible name が存在
- `getByRole("group", { name: "出席サマリー" })` が存在
- `getByRole("heading", { level: 1, name: /出席/ })` が `AdminPageHeader` 経由で 1 つだけ発火
- AdminTable の `<table>` が `aria-label` または `<caption>` を持つ（2 table 各 1 つ）

## 6.3 T-D-03 data-rendering

- by-session: `getAllByRole("row")` 数 = `data.length + 1`（header 行）
- ranking: `defaultSort: rate desc` を assert（最初の data row が最高 rate）
- KPI: `getAllByTestId(/^attendance-kpi-/)` が 3 件

## 6.4 T-D-04 fail-soft

- ケース1: overview のみ `ok: false` → AdminSectionErrorClient 1 件 + by-session / ranking 描画継続
- ケース2: by-session が `ok: true` で `data: []` → `AdminEmptyState`（testid `attendance-by-session-empty`）
- ケース3: ranking のみ `ok: false` → ranking 区画に AdminSectionErrorClient、他は描画

## 6.5 T-D-05 grep gate (CI / lefthook)

既存 `.github/workflows/verify-primitive-adoption.yml` または同 workflow が参照する script に以下 5 行を追加:

```bash
test "$(grep -c '<table' apps/web/app/\(admin\)/admin/dashboard/attendance/page.tsx)" -eq 0
test "$(grep -c 'function KpiCard' apps/web/app/\(admin\)/admin/dashboard/attendance/page.tsx)" -eq 0
grep -q 'AdminPageHeader' apps/web/app/\(admin\)/admin/dashboard/attendance/page.tsx
grep -q 'AttendanceDashboardSections' apps/web/app/\(admin\)/admin/dashboard/attendance/page.tsx
grep -q 'AdminTable'      apps/web/app/\(admin\)/admin/dashboard/attendance/AttendanceDashboardSections.client.tsx
grep -q 'KpiCard'         apps/web/app/\(admin\)/admin/dashboard/attendance/AttendanceDashboardSections.client.tsx
```

既存 grep gate ファイルがあれば追記、無ければ親 workflow の verify step に inline 追加（新規 yml は作らない）。

## メタ情報

| 項目 | 内容 |
|------|------|
| Phase | 6 |
| 対象 | focused test additions |

## 目的

実装に対応するテスト追加内容を固定する。

## 実行タスク

- page-local focused spec を追加する。
- primitive adoption grep gate を更新する。

## 参照資料

| 参照資料 | パス | 内容 |
|----------|------|------|
| verify primitive adoption | `.github/workflows/verify-primitive-adoption.yml` | grep gate 追記先 |

## 成果物

| 成果物 | パス | 内容 |
|--------|------|------|
| focused spec | `apps/web/app/(admin)/admin/dashboard/attendance/__tests__/page.spec.tsx` | T-D-01..D-04 |

## 完了条件

- [ ] focused spec と grep gate が AC-D1..D9 を補完している。
