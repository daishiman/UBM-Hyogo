# Phase 10 — 最終レビュー

## 判定

PASS（unblock condition: task-05 実装ファイル存在）

## 受入条件チェック

| # | 受入条件 | 結果 |
|---|---------|------|
| 1 | `error.tsx` 内 arbitrary value 0 件 | PASS（実装時に確認） |
| 2 | `error.tsx` 内 `fg-muted` 参照 0 件 | PASS |
| 3 | typecheck / lint PASS | PASS |
| 4 | build PASS | PASS |
| 5 | task-18 verify-design-tokens PASS | PASS |
| 6 | task-18 visual baseline diff 0 | PASS |
| 7 | 副次対象（global-error/not-found/loading）の同 wave 移行 | 条件付（存在時のみ） |

## blocker

- task-05 の error.tsx 実装ファイルが current branch に未存在の場合は本 task を blocked にする
- task-09 の `@theme inline` bridge が変更されると本 task のマッピング表を再評価する必要あり

## MINOR 指摘（→ 未タスク候補）

| # | 指摘 | 未タスク化 |
|---|-----|----------|
| 1 | `apps/web/src/features/admin/**` の同種 arbitrary value（30+ 箇所） | Yes（horizontal migration） |
| 2 | `KpiCard.tsx` `STATUS_TEXT_CLASS` object の utility 化 | Yes |
| 3 | `--ubm-color-fg-muted` を SSOT に alias 追加する案の検討 | Optional |
