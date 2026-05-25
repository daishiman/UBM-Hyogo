# [#264] [U-UT01-02] Cron 間隔の staging 測定（6h / 1h / 5min 実測）

## メタ情報

```yaml
issue_number: 264
title: [U-UT01-02] Cron 間隔の staging 測定（6h / 1h / 5min 実測）
state: OPEN
priority: 中
scale: -
category: 要件
status: -
created_date: 2026-04-29
updated_date: 2026-04-29
url: https://github.com/daishiman/UBM-Hyogo/issues/264
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | - |
| ステータス | - |

---

## 親タスク
- UT-01 (Sheets→D1 同期方式定義) Issue #50（CLOSED）

## 仕様書
- `docs/30-workflows/unassigned-task/U-UT01-02-cron-interval-staging-measurement.md`

## 概要
UT-01 Phase 2 で確定した既定 Cron 間隔 `0 */6 * * *` を staging で 6h / 1h / 5min の 3 段階で実測し、Sheets API quota / Workers Cron 実行回数 / D1 書込量 / SLA / `sync_log` 容量の観点から最適粒度を確定する設計判断タスク。UT-09 内吸収可能（独立化はオプション）。

## 苦戦箇所サマリ
1. `*/5 * * * *` で Sheets API quota（500/100s/project）を他経路と共有時に 429 発生可能性、backoff 発火頻度を `sync_log.retry_count` で実測必要
2. Workers Cron Triggers は最初の 1 tick まで最大 1 分遅延、5min 間隔の初回は基準点除外判断必要
3. `wrangler.toml` の `[triggers]` / `[env.staging.triggers]` / `[env.production.triggers]` で cron 配列が継承されないため 3 箇所明示必要
4. staging→production 移行時 cron 間隔差分で本番初動 quota スパイク、warm-up 期間の判断必要

## 受入条件（AC）
- [ ] AC-1: 3 間隔 24h 以上の観測ログ
- [ ] AC-2: 各間隔の API 呼出数 / cron 実行回数 / D1 row write / `sync_log` 行数増分の表 + 無料枠境界距離
- [ ] AC-3: 採択 cron 間隔 ADR + UT-09 `wrangler.toml` 反映指示
- [ ] AC-4: U-4 / UT-08 / U-6 連動ポイント明示
- [ ] AC-5: production 反映 PR 起票テンプレ

## 関連 U-N
- 上流: UT-09（実稼働ジョブ）/ UT-03（Sheets API 認証）
- 連携: UT-04 / UT-08 / U-4（sync_log 保持期間）/ U-6（GCP quota 配分）

## 起票元
UT-01 phase-12 `unassigned-task-detection.md` U-2
