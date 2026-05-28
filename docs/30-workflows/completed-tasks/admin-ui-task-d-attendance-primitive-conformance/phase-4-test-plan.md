---
実装区分: 実装仕様書
Phase: 4
状態: completed
task_id: admin-ui-task-d-attendance-primitive-conformance
親: [index.md](./index.md)
前: [phase-3-design-review.md](./phase-3-design-review.md)
次: [phase-5-implementation.md](./phase-5-implementation.md)
---

# Phase 4: テスト計画

## 4.1 テストケース一覧

| ID | 種別 | 観点 | 紐づく AC |
|----|------|------|-----------|
| T-D-01 | vitest snapshot | `attendance/page.tsx` の 3 区画 testid 安定 | AC-D9 |
| T-D-02 | vitest a11y | page root accessible name / KpiCard group / AdminTable `<caption>` | AC-D8 |
| T-D-03 | vitest data-rendering | overview ok → KpiCard 3 枚 / by-session 行数 = data.length / ranking default sort = rate desc | AC-D3..D5 |
| T-D-04 | vitest fail-soft | 3 endpoint のいずれかが `ok: false` のとき該当区画のみ AdminSectionErrorClient、他は描画継続 | AC-D7 |
| T-D-05 | grep gate (CI / lefthook) | `<table` 0 / `function KpiCard` 0 / `AdminPageHeader` ≥1 / `AdminTable` ≥1 | AC-D1..D5 |

## 4.2 テストファイル配置

- `apps/web/app/(admin)/admin/dashboard/attendance/__tests__/page.spec.tsx`（新規・T-D-01..D-04）
- T-D-05 は CI / lefthook の grep step として実装、独立 vitest spec は作らない

## 4.3 fixture 方針

- 3 endpoint mock は `safeServerFetch` を `vi.mock` で差し替え、`{ ok: true, data: <fixture> }` / `{ ok: false, error: ... }` の組合せで 4 ケース（全 ok / overview err / by-session 空 / ranking err）を網羅
- fixture は spec file 内に inline 定義（外部 JSON 化しない）

## メタ情報

| 項目 | 内容 |
|------|------|
| Phase | 4 |
| 対象 | page-local focused test |

## 目的

AC-D1..D9 を検証可能なテスト計画へ落とす。

## 実行タスク

- focused Vitest と grep gate を定義する。

## 参照資料

| 参照資料 | パス | 内容 |
|----------|------|------|
| attendance page | `apps/web/app/(admin)/admin/dashboard/attendance/page.tsx` | 対象 page |

## 成果物

| 成果物 | パス | 内容 |
|--------|------|------|
| Phase 4 spec | `phase-4-test-plan.md` | テスト計画 |

## 完了条件

- [ ] T-D-01..D-05 が AC に紐づいている。
