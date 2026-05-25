# [#115] [UT-06-FU-B] apps/api wrangler.toml の env.production セクション一本化

## メタ情報

```yaml
issue_number: 115
title: [UT-06-FU-B] apps/api wrangler.toml の env.production セクション一本化
state: OPEN
priority: 中
scale: -
category: リファクタリング
status: -
created_date: 2026-04-27
updated_date: 2026-04-27
url: https://github.com/daishiman/UBM-Hyogo/issues/115
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | - |
| ステータス | - |

---

## 概要

`apps/api/wrangler.toml` でトップレベル設定と `[env.production]` セクションに同じ値が重複している。`[env.production]` を正として一元化し Phase 8 / Phase 12 docs との drift を解消する。

## 仕様書

`docs/30-workflows/unassigned-task/ut-06-followup-B-api-env-production-section.md`

## 由来

UT-06 Phase 12 UNASSIGNED-B
