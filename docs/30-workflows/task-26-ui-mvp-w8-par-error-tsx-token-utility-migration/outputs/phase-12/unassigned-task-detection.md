# Phase 12 — 未タスク検出レポート

## 検出件数

`current`: 3 件 / `baseline`: 0 件

## current（本 task の Phase 10 MINOR 指摘起点）

### UT-26-01: features/admin 配下の同種 arbitrary value 横展開

- **状態**: 未着手
- **対象**: `apps/web/src/features/admin/**`（30+ 箇所、grep 検出）
- **関連タスク差分**: task-26 は `apps/web/src/app/error.tsx` に限定。本件は別 task として独立。
- **推奨**: horizontal migration task として spec 化

### UT-26-02: KpiCard.tsx `STATUS_TEXT_CLASS` 色マップ object の utility 化

- **状態**: 未着手
- **対象**: `apps/web/src/features/admin/components/_dashboard/KpiCard.tsx`、`StatusDistribution.tsx`
- **関連タスク差分**: なし
- **推奨**: status-text-class refactor task

### UT-26-03: SSOT に `--ubm-color-fg-muted` を alias で追加するかの議論

- **状態**: 未着手（optional）
- **対象**: `docs/00-getting-started-manual/specs/09b-design-tokens.md`
- **判断**: 本 task で `text-text-3` に統合したため alias 追加は不要との結論。ただし将来 fg / bg semantic 命名を導入する場合は再評価
- **推奨**: 議論ログのみ残す（task 不要）

## baseline

検出 0 件。

## 関連タスク重複確認（FB-CANCEL-004-2）

- 既存 unassigned-task ledger 未確認のため、Phase 12 close-out 時に `docs/30-workflows/unassigned-task/` を grep して重複起票なきことを確認する
