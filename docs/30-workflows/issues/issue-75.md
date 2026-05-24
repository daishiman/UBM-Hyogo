# [#75] [UT-08-IMPL] モニタリング/アラート実装

## メタ情報

```yaml
issue_number: 75
title: [UT-08-IMPL] モニタリング/アラート実装
state: OPEN
priority: 高
scale: -
category: 要件
status: -
created_date: 2026-04-27
updated_date: 2026-04-27
url: https://github.com/daishiman/UBM-Hyogo/issues/75
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 高 |
| 規模 | - |
| ステータス | - |

---

## 概要

UT-08 監視・アラート設計（spec_created、Issue #10 にて完了済）の Wave 2 実装フェーズ。WAE 計装・アラートワーカー・通知配信・外形監視・Secret 展開を実装する。設計完了と実装完了を混同しないため、本 Issue で実作業を管理する。

## 仕様書

- [`docs/unassigned-task/UT-08-IMPL-monitoring-alert-implementation.md`](../blob/main/docs/unassigned-task/UT-08-IMPL-monitoring-alert-implementation.md)
- 上流設計: [`docs/30-workflows/ut-08-monitoring-alert-design/`](../blob/main/docs/30-workflows/ut-08-monitoring-alert-design)（Phase 1-13 完了）
- Wave 2 ガイド: [`outputs/phase-12/implementation-guide.md`](../blob/main/docs/30-workflows/ut-08-monitoring-alert-design/outputs/phase-12/implementation-guide.md)

## スコープ（要点）

- `apps/api/src/observability/wae.ts` の WAE writer abstraction
- Hono middleware からの `api.request` / `api.error` 計装
- D1 wrapper からの `d1.query.fail` 計装
- Cron handler からの `cron.sync.start` / `cron.sync.end` 計装
- アラートワーカー（Cron 1min）と alert-rule tests
- Slack Webhook / Email fallback の notifier abstraction
- `MONITORING_AE` binding / Secret / Variables の env validation
- UptimeRobot monitor 設定
- 05a runbook への差分追記 PR または 05a 側タスクへの引き渡し

## 実装前ゲート

- [ ] **UT-30** 完了（05a outputs 個別ファイル生成）
- [ ] WAE 無料枠（保存期間・data points 上限）の Cloudflare 公式情報での再確認
- [ ] UT-09 の Cron 間隔・エラー分類確定
- [ ] UT-07 経由か Slack direct MVP かの実装時点での再確認
- [ ] `auth.fail` イベント採否の UT-13 との確認

## 関連

- 上流: #10 (UT-08 設計、CLOSED)
- 連携: UT-09 (#11) / UT-07 (#55) / UT-13 / UT-17 (#20) / UT-18 (#21)
- 後続: UT-31（月次運用サイクル化）

## 受入条件

- [ ] `MONITORING_AE` binding と `ubm_hyogo_monitoring` dataset が設定されている
- [ ] PII（email / userId / IP）が WAE data point に入らない
- [ ] alert rule が `alert-threshold-matrix.md` の WARNING / CRITICAL を参照し、ハードコード散在がない
- [ ] Slack Webhook 失敗時の Email fallback がある（30 分 dedupe key 維持）
- [ ] UptimeRobot monitors が設定され、死活監視テストが通過している
- [ ] 05a runbook 差分追記または追記タスクへの引き渡しが完了している

## 起票元

UT-08 Phase 12 `unassigned-task-detection.md` current #1（HIGH）
