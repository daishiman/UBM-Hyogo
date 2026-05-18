# Phase 12 unassigned-task-detection - UT-07A-04

## 本タスクで新たに検出された unassigned task

| ID 候補 | 概要 | 起票先 | 優先度 |
| --- | --- | --- | --- |
| (未検出) | — | — | — |

> 本タスク自体が UT-07A-04 として残っていた ADR 判断タスクの消費であり、副次的に新規 unassigned task は検出されていない。

## 再評価トリガに紐づく将来タスク候補

下記は ADR 0002 の Re-evaluation triggers に対応する「条件発生時に新規タスク化すべき項目」。現時点では起票しない:

| トリガ | 発生時の想定タスク |
| --- | --- |
| (a) 監査 UI で特定 queue 由来タグ一覧表示要件 | `member_tags.assigned_via_queue_id` 列追加 ADR (supersedes 0002) + migration + repository + API + test |
| (b) audit_log の保持期間短縮または物理削除方針で queue 追跡履歴を保持できなくなる場合 | queue trace 永続化方式の再設計 |
| (c) D1 read で audit join 性能問題 | index 戦略再評価 or 列追加 ADR |

## 07a 親への closure 反映

`docs/30-workflows/completed-tasks/07a-parallel-tag-assignment-queue-resolve-workflow/outputs/phase-12/unassigned-task-detection.md` 行 10 の UT-07A-04 行に、本 ADR 0002 によって closure された旨を back-link 追記済み。

## Phase 12 実行時に記録

- 検出 unassigned 件数: 0
- source UT-07A-04: consumed
- 再評価トリガ将来候補: 3 件（条件発生時のみ起票）
