# [#123] [UT-06-FU-J] apps/api に CORS preflight policy を実装

## メタ情報

```yaml
issue_number: 123
title: [UT-06-FU-J] apps/api に CORS preflight policy を実装
state: OPEN
priority: 中
scale: -
category: 改善
status: -
created_date: 2026-04-27
updated_date: 2026-04-27
url: https://github.com/daishiman/UBM-Hyogo/issues/123
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | - |
| ステータス | - |

---

## 概要

Hono に CORS middleware を実装し OPTIONS preflight に対応。Phase 11 S-06 PASS の前提。

## 仕様書

`docs/30-workflows/unassigned-task/ut-06-followup-J-cors-preflight-policy.md`

## 由来

UT-06 Phase 12 UNASSIGNED-J / 実行前ブロッカー B-4
