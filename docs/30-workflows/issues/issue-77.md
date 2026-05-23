# [#77] [UT-31] 監視運用月次サイクル化（閾値レビュー / Email 到達確認）

## メタ情報

```yaml
issue_number: 77
title: [UT-31] 監視運用月次サイクル化（閾値レビュー / Email 到達確認）
state: OPEN
priority: 低
scale: -
category: 要件
status: -
created_date: 2026-04-27
updated_date: 2026-04-27
url: https://github.com/daishiman/UBM-Hyogo/issues/77
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 低 |
| 規模 | - |
| ステータス | - |

---

## 概要

UT-08-IMPL でモニタリング・アラート機構が稼働開始した後の **月次運用サイクル**（閾値見直し / Email 経路生存確認 / WAE データ点上限確認 / UptimeRobot 疎通確認）を運用カレンダーに固定化する。アラート疲れ防止と CRITICAL 通知有効化判断（誤報率 1 件/月以下が 30 日連続）の客観評価データを蓄積する。

## 仕様書

- [`docs/unassigned-task/UT-31-monitoring-monthly-operations.md`](../blob/main/docs/unassigned-task/UT-31-monitoring-monthly-operations.md)

## 起票背景

UT-08 Phase 10 MINOR-02（閾値月次レビュー）/ MINOR-03（Email 月次到達確認）を運用ルーチンとして正式化。UT-08-IMPL（実装スコープ）と独立した運用継続スコープとして責務オーナーを明確に分離する。

## スコープ

- 運用ハンドブック作成（毎月 1 営業日に 4 項目チェック）
  - 閾値月次レビュー（誤報率 / 未検知率 → 緩和 or 厳格化判断）
  - CRITICAL 経路 Email テスト送信
  - WAE data points 月次累計確認（70% 到達でサンプリング切替）
  - UptimeRobot monitor 数 / Slack 疎通確認
- レビュー結果ログテンプレート（過去 6 ヶ月保管）
- 異常検出時の対応フロー
- CRITICAL 通知有効化判断ゲートの客観条件文書化

## 完了条件

- [ ] 運用ハンドブックが作成され、4 項目の月次チェック手順が記載されている
- [ ] レビュー結果ログテンプレートが作成され、過去 6 ヶ月保管ルールが文書化されている
- [ ] CRITICAL 通知有効化判断ゲート（誤報率 1 件/月以下が 30 日連続）の客観条件が文書化されている
- [ ] 初回月次レビュー実施結果が `monitoring-review-logs/` 配下にログ化されている
- [ ] 運用カレンダーに毎月 1 営業日の月次レビューが定期登録されている

## 関連

- 上流: UT-08-IMPL（監視機構稼働後 + 1ヶ月以上のデータ蓄積が前提）
- 連携: UT-30（cost-guardrail-runbook.md に月次運用サイクル導線を追記）

## 起票元

UT-08 Phase 12 `unassigned-task-detection.md` current #4 / #5（MINOR-02 / MINOR-03 formalize）
