# Unassigned Task Detection

## Summary

0 件 placeholder ではなく、実装・運用に必要な follow-up を open として分離する。

| ID | status | formalize decision | path / owner | 根拠 |
| --- | --- | --- | --- | --- |
| U-1 | formalized_existing | 既存未タスクへ集約 | `docs/30-workflows/unassigned-task/task-impl-opennext-workers-migration-001.md` | `.github/workflows/web-cd.yml` 改修、staging / production deploy、Phase 11 実測 evidence |
| U-2 | covered_by_U-1 | U-1 に内包 | production custom domain cutover operation | runbook S4、AC-6、RISK-2 |
| U-3 | formalized_new | UT-28 系列で別承認 | `docs/30-workflows/unassigned-task/task-issue-355-pages-project-delete-after-dormant-001.md` | Pages dormant 2週間後の削除はdeploy cutoverと別リスク |
| U-4 | formalized_existing | 既存preflight / diff系列へ委譲 | `UT-06-FU-A-logpush-target-diff-script-001` / route inventory系列 | Pages 由来 observability の切替が必要 |
| U-5 | covered_by_U-1 | U-1 のCD設計レビューに含める | UT-29 job structure consistency review | API CD と Web CD の environment / approval gate 整合 |

## Materialization rule

新規ファイルとして未タスクを乱立させない。U-1 は既存の `task-impl-opennext-workers-migration-001.md` が正式な実装follow-upであり、U-2 / U-5 はそのACに吸収する。U-3 はCloudflare Pages物理削除という破壊的操作を含むため、deploy cutoverとは別承認の `task-issue-355-pages-project-delete-after-dormant-001.md` としてformalizeした。U-4 は既存のroute inventory / Logpush diff系列に委譲する。

## CLOSED Issue handling

Issue #355 は CLOSED のため reopen しない。実装 follow-up は新規 Issue で fork するか、PR description で `Refs #355` のみを使う。
