# [#226] [skill-ledger T-6 U-2] Issue #130/#129 状態検査の CI 化

## メタ情報

```yaml
issue_number: 226
title: [skill-ledger T-6 U-2] Issue #130/#129 状態検査の CI 化
state: OPEN
priority: 中
scale: 小規模
category: 改善
status: 未実施
created_date: 2026-04-29
updated_date: 2026-04-29
url: https://github.com/daishiman/UBM-Hyogo/issues/226
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | 小規模 |
| ステータス | 未実施 |

---

## 概要

T-6 hook 実装着手前の AC-5 gate（A-1 #130 / A-2 #129 が CLOSED）を CI で機械的に検査する小スクリプトを `.github/workflows/` 配下に追加する。

## 仕様書

- docs/30-workflows/unassigned-task/task-skill-ledger-t6-issue-state-gate-ci.md

## 起点

- docs/30-workflows/skill-ledger-t6-hook-idempotency/outputs/phase-12/unassigned-task-detection.md (U-2)

## 受入条件

- AC-1: T-6 系ブランチへの push で gate workflow が起動
- AC-2: #130 / #129 の片方でも OPEN なら CI fail
- AC-3: 両 CLOSED で gate success
- AC-5: `GITHUB_TOKEN` の最小権限（`issues: read`）で済む
