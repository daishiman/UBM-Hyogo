# [#322] [UT-08A-03] production 環境負荷テスト

## メタ情報

```yaml
task_id: UT-08A-03
task_name: production 環境負荷テスト
category: 運用
target_feature: Cloudflare Workers (apps/api / apps/web) / D1 free tier
priority: 低
scale: 中規模
status: 未実施
source_phase: 08a Phase 12 unassigned-task-detection
created_date: 2026-04-30
dependencies: []
spec_path: docs/30-workflows/unassigned-task/UT-08A-03-production-load-test.md
```

## 概要

無料枠制約下の MVP に対する peak / 連続稼働の 2 種負荷シナリオを定義し、p50/p95/p99 latency と D1 quota 消費見込みを実測。09b release runbook に紐付ける。

## 仕様書

`docs/30-workflows/unassigned-task/UT-08A-03-production-load-test.md`

## 受入条件

- 想定 MVP 利用者規模（同時接続・peak RPS）の定義
- k6 / artillery / wrangler tail で代表 endpoint の latency と error rate を取得
- D1 read/write quota 消費を 1 日 sample から外挿
- 結果を 09b release runbook へ格納

## 苦戦箇所

- 対象: 無料枠の負荷テスト実施環境
- 症状: production 直接負荷は 503 リスク・staging も同一無料枠を共有するため本番影響を完全に切り離せない。abort thresholds と実施 window を runbook で先に固める必要がある。
- 参照: `docs/30-workflows/08a-parallel-api-contract-repository-and-authorization-tests/outputs/phase-12/unassigned-task-detection.md` §3
