# [#228] [skill-ledger T-6 U-4] 4 worktree smoke の CI matrix 化

## メタ情報

```yaml
issue_number: 228
title: [skill-ledger T-6 U-4] 4 worktree smoke の CI matrix 化
state: OPEN
priority: 低
scale: 小規模
category: 改善
status: 未実施
created_date: 2026-04-29
updated_date: 2026-04-29
url: https://github.com/daishiman/UBM-Hyogo/issues/228
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 低 |
| 規模 | 小規模 |
| ステータス | 未実施 |

---

## 概要

ローカルでの I/O 飽和は CI で再現できないが、`unmerged=0` の最低限ガードを CI matrix で常時走らせる構想。NON_VISUAL タスクの evidence 自動化に資する。

## 仕様書

- docs/30-workflows/unassigned-task/task-skill-ledger-t6-ci-matrix-smoke.md

## 起点

- docs/30-workflows/skill-ledger-t6-hook-idempotency/outputs/phase-12/unassigned-task-detection.md (U-4)

## 受入条件

- AC-1: matrix job が PR push で起動、shard 数 ≥ 2
- AC-2: `unmerged > 0` 検出時に CI fail
- AC-3: 失敗 shard の log/artifact が取得可能
- AC-4: `verify-indexes` workflow との責務分離が文書化
