# Implementation Guide

## Part 1: 中学生レベル

なぜこの作業が必要かというと、同期の記録を書く場所の名前が人によってずれると、あとで探す人が迷うからです。学校で言えば、出席簿は「だれが来たか」を書くノート、教室のカギは「同時に二人が同じ教室を使わない」ための道具です。

この仕様では、出席簿にあたる名前を `sync_job_logs`、教室のカギにあたる名前を `sync_locks` にします。`sync_log` は「同期の記録」という考え方の名前としてだけ使い、実際の表の名前にはしません。

| 専門用語 | 日常語の言い換え |
| --- | --- |
| canonical | 正しい名前 |
| receiver | 受け取り先 |
| ledger | 記録ノート |
| lock | カギ |
| migration | 入れ物を作る手順 |

## Part 2: 技術者レベル

- `sync_job_logs`: sync job ledger table name.
- `sync_locks`: sync mutex table name.
- `sync_log`: logical concept only; do not create, rename, or drop a physical table with this name.
- Receiver path: `docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md`.
- Parent SSOT: `docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/`.

UT-09 implementation must include the parent Phase 2 four files as required references before code work starts.

## Non-Visual Evidence

This workflow has no UI changes. Phase 11 uses `outputs/phase-11/manual-smoke-log.md` and `outputs/phase-11/link-checklist.md` as NON_VISUAL evidence, so screenshot references are intentionally N/A.
