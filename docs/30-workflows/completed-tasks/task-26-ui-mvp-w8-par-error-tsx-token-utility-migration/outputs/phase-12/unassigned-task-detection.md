# Phase 12 — 未タスク検出レポート

## 検出件数

`current`: 0 件 / `baseline`: 0 件

## 判定

task-26 の責務は App Router boundary 群（`apps/web/app/error.tsx`, `not-found.tsx`, `loading.tsx`）の consumer migration に限定する。実測で見つかった `apps/web/src/features/admin/**` の arbitrary value は task-26 の未完了ではなく、task-24 invariant audit と task-18 verify-design-tokens / Playwright smoke の広域 regression gate に属する。

## 関連観測（未タスク化しない）

| 観測 | 判定 | 理由 |
| --- | --- | --- |
| `apps/web/src/features/admin/**` の同種 arbitrary value | not current task | admin feature 全体の横展開であり、task-26 boundary 群とは責務が異なる。task-24 / task-18 の広域 gate として扱う |
| `KpiCard.tsx` `STATUS_TEXT_CLASS` 色マップ | not current task | status tone abstraction は admin dashboard refactor の論点であり、error boundary migration とは独立 |
| `--ubm-color-fg-muted` alias 追加案 | task不要 | SSOT には追加せず、consumer を `text-text-3` へ統合する判断で解決済み |

## 重複確認

`docs/30-workflows/unassigned-task/` の `arbitrary value` / `fg-muted` / `token utility` grep では task-26 直下の未完了 follow-up は検出されなかった。新規未タスク作成は不要。
