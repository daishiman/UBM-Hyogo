# Phase 8 — リファクタリング

## 変更テーブル（FB-RT-03）

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| `apps/web/app/error.tsx` 全 className | `text-[var(--ubm-color-*)]` / `bg-[var(--ubm-color-*)]` 形式 | `text-<bridge>` / `bg-<bridge>` 形式（@theme inline utility）| design-token bridge（task-09）の正式経路に揃え、CI gate（task-18）通過 |
| `--ubm-color-fg-muted` 参照 | 直書き（旧互換 alias / runtime stale） | `text-text-3`（`--ubm-color-text-muted` bridge）| 命名齟齬解消・runtime bridge 整合 |

## duplicate 削減

- inline color literal の重複削減（同一値 → 同一 utility）

## navigation drift

なし（コンポーネント構造不変）。

## 命名一貫性

| 旧呼称 | 新呼称 | 出典 |
|-------|-------|------|
| fg-muted | text-3 / text-muted | task-08 SSOT |
