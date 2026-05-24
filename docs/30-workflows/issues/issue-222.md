# [#222] [04a-followup-003] 公開検索 query parser の packages/shared 移設

## メタ情報

```yaml
issue_number: 222
title: [04a-followup-003] 公開検索 query parser の packages/shared 移設
state: OPEN
priority: 中
scale: 小規模
category: リファクタリング
status: 未実施
created_date: 2026-04-29
updated_date: 2026-04-29
url: https://github.com/daishiman/UBM-Hyogo/issues/222
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | 小規模 |
| ステータス | 未実施 |

---

## 概要

`apps/api/src/_shared/search-query-parser.ts` を `packages/shared` に移設し、`apps/api` と `apps/web` (06a) で同一実装を共有する。

## 着手条件

06a (apps/web 公開ディレクトリ実装) で同等パーサが必要になる時点。

## 受入条件

- `packages/shared` に query schema / parse / serialize が export
- `apps/api` の既存 contract が壊れない
- 不正値（`limit=999` / `page=0` / `sort=invalid`）が zod parse で 400
- shared 側 unit test が pass
- `apps/web` から import 可能（boundary lint OK）

## 仕様書

`docs/30-workflows/unassigned-task/04a-followup-003-public-search-query-parser-shared.md`

## 発見元

04a Phase 12 unassigned-task-detection.md (U-3) / skill-feedback (S-1)
