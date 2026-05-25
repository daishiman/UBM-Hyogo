# [#227] [skill-ledger T-6 U-3] 案 C（hook 廃止 + 完全静的化）影響範囲調査

## メタ情報

```yaml
issue_number: 227
title: [skill-ledger T-6 U-3] 案 C（hook 廃止 + 完全静的化）影響範囲調査
state: OPEN
priority: 低
scale: 小規模
category: 改善
status: 未実施
created_date: 2026-04-29
updated_date: 2026-04-29
url: https://github.com/daishiman/UBM-Hyogo/issues/227
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 低 |
| 規模 | 小規模 |
| ステータス | 未実施 |

---

## 概要

T-6 で base case D（hook 冪等化を残す）を採用したが、案 C（hook 廃止 + `pnpm indexes:rebuild` を CI/手動運用に一本化）の影響範囲を将来オプションとして整理する research task。

## 仕様書

- docs/30-workflows/unassigned-task/task-skill-ledger-t6-plan-c-static-research.md

## 起点

- docs/30-workflows/skill-ledger-t6-hook-idempotency/outputs/phase-12/unassigned-task-detection.md (U-3)

## 受入条件

- AC-1: 廃止対象 hook と置換コマンドの対応表
- AC-2: 採用判定指標と閾値案のドキュメント化
- AC-3: `references/skill-ledger-gitignore-policy.md` から比較表が引ける
