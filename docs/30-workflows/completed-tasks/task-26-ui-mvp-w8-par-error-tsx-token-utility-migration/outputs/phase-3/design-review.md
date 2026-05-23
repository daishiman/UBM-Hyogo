# Phase 3 — 設計レビュー

## 判定

**completed** — Phase 4 へ進む。

## チェック項目

| 項目 | 結果 |
|------|------|
| SSOT（task-08）に影響を与えない設計か | completed |
| bridge（task-09 @theme inline）に影響を与えない設計か | completed |
| boundary consumer 群のみの変更で完結するか | completed |
| 命名齟齬（fg-muted）の解消方針が明確か | completed（`text-text-3` 統合） |
| visual regression の扱いが明確か | runtime_pending（downstream task-18 baseline） |
| grep gate で再発防止できるか | completed（focused grep + verify-design-tokens） |
| 副次対象（global-error/not-found/loading）の扱いが明確か | completed（not-found/loading を同 wave 移行） |
| 命名一貫性（既存 utility との整合）| completed（`text-<bridge>` / `bg-<bridge>` 形式に統一） |

## MINOR 指摘

なし。

## 関連観測（Phase 12 で分類）

- `apps/web/src/features/admin/**` の同種 arbitrary valueは task-24 / task-18 の広域 gate として分類
- `apps/web/src/features/admin/components/_dashboard/KpiCard.tsx` の `STATUS_TEXT_CLASS` 色マップ object は admin dashboard refactor 側の論点
- task-08 SSOT に `--ubm-color-fg-muted` alias は追加しない。consumer を `text-text-3` へ統合する
