# [#116] [UT-06-FU-C] D1 database_id の CI 注入式化

## メタ情報

```yaml
issue_number: 116
title: [UT-06-FU-C] D1 database_id の CI 注入式化
state: OPEN
priority: 低
scale: -
category: リファクタリング
status: -
created_date: 2026-04-27
updated_date: 2026-04-27
url: https://github.com/daishiman/UBM-Hyogo/issues/116
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 低 |
| 規模 | - |
| ステータス | - |

---

## 概要

`apps/api/wrangler.toml` の D1 `database_id` を直書きから CI/CD 注入式に変更し管理粒度を改善する。

## 仕様書

`docs/30-workflows/unassigned-task/ut-06-followup-C-d1-database-id-injection.md`

## 由来

UT-06 Phase 12 UNASSIGNED-C
