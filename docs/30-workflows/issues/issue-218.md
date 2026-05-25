# [#218] [04b-followup-002] /me/* rate limit の KV / D1 ベース cross-isolate 化

## メタ情報

```yaml
issue_number: 218
title: [04b-followup-002] /me/* rate limit の KV / D1 ベース cross-isolate 化
state: OPEN
priority: 中
scale: 小規模
category: 改善
status: 未実施
created_date: 2026-04-29
updated_date: 2026-04-29
url: https://github.com/daishiman/UBM-Hyogo/issues/218
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | 小規模 |
| ステータス | 未実施 |

---

## 概要

04b で実装した `/me/visibility-request` / `/me/delete-request` の rate-limit（5 req/60s）を、Worker isolate ローカルの in-memory Map から Cloudflare KV ベースに切り替え、isolate を跨いでも上限が厳守される状態にする。

## 背景

MVP 優先で in-memory 実装としたが、Workers は複数 isolate に分散するため実効レートが isolate 倍に緩む。スパム抑止の観点で本番運用前に解消する。

## 完了条件

- KV ベース limiter が production / staging で選択される
- in-memory limiter は dev 限定
- 5 req/60s が isolate 跨ぎでも厳守される

## 詳細仕様

`docs/30-workflows/unassigned-task/04b-followup-002-rate-limit-kv-cross-isolate.md`

## 依存

UT-32 / UT-35 / UT-36（KV foundation）完了が前提。

## 参照

- 04b Phase 12 unassigned-task-detection.md
- `apps/api/src/middleware/rate-limit-self-request.ts`
