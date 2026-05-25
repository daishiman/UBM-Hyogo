# [#122] [UT-06-FU-I] API /health の docs と実装レスポンス形式統一

## メタ情報

```yaml
issue_number: 122
title: [UT-06-FU-I] API /health の docs と実装レスポンス形式統一
state: OPEN
priority: 中
scale: -
category: リファクタリング
status: -
created_date: 2026-04-27
updated_date: 2026-04-27
url: https://github.com/daishiman/UBM-Hyogo/issues/122
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | - |
| ステータス | - |

---

## 概要

docs `{"status":"healthy"}` と実装 `{ ok: true, foundation, integrationRuntimeTarget }` の drift を解消し contract test を追加。

## 仕様書

`docs/30-workflows/unassigned-task/ut-06-followup-I-health-response-sync.md`

## 由来

UT-06 Phase 12 UNASSIGNED-I / 実行前ブロッカー B-3
