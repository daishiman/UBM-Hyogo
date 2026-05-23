# [#220] [04a-followup-001] 公開 endpoint の miniflare contract / integration / leak suite 整備

## メタ情報

```yaml
issue_number: 220
title: [04a-followup-001] 公開 endpoint の miniflare contract / integration / leak suite 整備
state: OPEN
priority: 中
scale: 中規模
category: 改善
status: 未実施
created_date: 2026-04-29
updated_date: 2026-04-29
url: https://github.com/daishiman/UBM-Hyogo/issues/220
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | 中規模 |
| ステータス | 未実施 |

---

## 概要

04a で実装した公開 endpoint 4 本に対する miniflare ベースの contract / integration / leak suite を整備する。

## 背景

04a スコープでは unit + converter テストで leak 防御を担保したが、SQL where → repository EXISTS → converter status 二重チェック → visibility filter → runtime delete → zod strict の **6 層が結線として機能している保証** は contract test でしか得られない。

## 受入条件

- `pnpm --filter @ubm/api test:contract` で contract suite が実行できる
- `/public/{stats,members,members/:id,form-preview}` の happy path が pass
- leak regression: `responseEmail` / `rulesConsent` / `adminNotes` が response 全体に含まれないことを assert
- 削除済み / pending / withdrawn member が list / detail に出ない
- pagination meta の境界値 OK
- session middleware を `/public` に挿入した状態で 401 にならない（middleware 非適用の保証）

## 仕様書

`docs/30-workflows/unassigned-task/04a-followup-001-miniflare-public-contract-suite.md`

## 発見元

04a Phase 12 unassigned-task-detection.md (U-1)
