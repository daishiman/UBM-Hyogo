# [#117] [UT-06-FU-D] apps/api wrangler.toml の vars 重複定義整理

## メタ情報

```yaml
issue_number: 117
title: [UT-06-FU-D] apps/api wrangler.toml の vars 重複定義整理
state: OPEN
priority: 低
scale: -
category: リファクタリング
status: -
created_date: 2026-04-27
updated_date: 2026-04-27
url: https://github.com/daishiman/UBM-Hyogo/issues/117
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 低 |
| 規模 | - |
| ステータス | - |

---

## 概要

`[env.production.vars]` と `[env.staging.vars]` で同値定義されている `SHEET_ID` / `FORM_ID` をトップレベル `[vars]` に集約し保守コストを削減。

## 仕様書

`docs/30-workflows/unassigned-task/ut-06-followup-D-vars-dry-up.md`

## 由来

UT-06 Phase 12 UNASSIGNED-D
