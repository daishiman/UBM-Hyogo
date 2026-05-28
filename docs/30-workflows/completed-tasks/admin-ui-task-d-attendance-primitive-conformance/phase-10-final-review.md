---
実装区分: 実装仕様書
Phase: 10
状態: completed
task_id: admin-ui-task-d-attendance-primitive-conformance
親: [index.md](./index.md)
前: [phase-9-qa.md](./phase-9-qa.md)
次: [phase-11-manual-test.md](./phase-11-manual-test.md)
---

# Phase 10: 最終レビュー

## 10.1 AC 機械検証マトリクス

| AC | 検証コマンド | 期待 |
|----|-------------|------|
| AC-D1 | `grep -c '<table' apps/web/app/\(admin\)/admin/dashboard/attendance/page.tsx` | 0 |
| AC-D2 | `grep -c 'function KpiCard' apps/web/app/\(admin\)/admin/dashboard/attendance/page.tsx` | 0 |
| AC-D3 | `grep -c 'AdminPageHeader' .../attendance/page.tsx` | ≥ 1 |
| AC-D4 | `grep -c 'KpiCard' .../attendance/AttendanceDashboardSections.client.tsx` | ≥ 1 |
| AC-D5 | `grep -c 'AdminTable' .../attendance/AttendanceDashboardSections.client.tsx` | ≥ 1 |
| AC-D6 | `git diff dev -- apps/api/src/routes/admin/dashboard.ts \| wc -l` | 0 |
| AC-D7 | `pnpm --filter @ubm-hyogo/web test -- attendance-page` T-D-04 | green |
| AC-D8 | T-D-02 | green |
| AC-D9 | T-D-01 | green |

## 10.2 親 workflow との整合

- 親 `admin-ui-prototype-alignment` の Phase 9 cross-page consistency review に Task D 達成項目を merge
- 不変条件チェック: HEX 直書き 0 / `<input>` 直書きなし / D1 直接アクセスなし

## 10.3 リリース可否判定

すべての AC が green、不変条件違反なし、design-token gate green であれば Phase 11 へ進む。

## メタ情報

| 項目 | 内容 |
|------|------|
| Phase | 10 |
| 対象 | final review |

## 目的

AC と不変条件の最終確認を行う。

## 実行タスク

- AC-D1..D9 の検証コマンドを実行する。
- 親 workflow との整合を確認する。

## 参照資料

| 参照資料 | パス | 内容 |
|----------|------|------|
| parent workflow | `docs/30-workflows/admin-ui-prototype-alignment/` | Task D parent |

## 成果物

| 成果物 | パス | 内容 |
|--------|------|------|
| final review | `outputs/phase-10/final-review.md` | 実装時に記録 |

## 完了条件

- [ ] AC-D1..D9 がすべて green である。
