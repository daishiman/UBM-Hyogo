# Implementation Guide

## Part 1: 中学生レベル

公開ステータスの数を、文字のリストだけでなく棒グラフでも見えるようにした。データがまだ来ない時は、今まで通り「分布データは現在集計対象外です」と表示する。

## Part 2: 技術者レベル

`StatusDistribution` は presentational component のまま維持する。`StatusSlice[]` が渡された時だけ `computeBarLayout()` で SVG 座標を計算し、`role="img"` と `aria-label` を持つ chart を描画する。色は `var(--ubm-color-ok|info|warn)` に固定し、HEX literal と chart dependency を追加しない。API 側は既存 `GET /admin/dashboard` に `byStatus` を追加し、新 endpoint は作らない。

## 検証

- `apps/web/src/features/admin/components/_dashboard/StatusDistribution.spec.tsx`
- `apps/api/src/routes/admin/dashboard.contract.spec.ts`
- `outputs/phase-11/evidence/test.log`
- `outputs/phase-11/evidence/grep-gate.log`
- `outputs/phase-11/evidence/a11y-aria-label.txt`
- `outputs/phase-11/evidence/visual-diff-summary.txt`
- `outputs/phase-11/screenshots/admin-dashboard-placeholder.png` / `admin-dashboard-chart.png` は placeholder artifact。authenticated runtime screenshot は user-gated。
