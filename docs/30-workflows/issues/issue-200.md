# [#200] [03b-followup-007] sync_jobs ロック TTL 超過時の手動解除 runbook

## メタ情報

```yaml
issue_number: 200
title: [03b-followup-007] sync_jobs ロック TTL 超過時の手動解除 runbook
state: OPEN
priority: 中
scale: 小規模
category: 改善
status: 未実施
created_date: 2026-04-28
updated_date: 2026-04-28
url: https://github.com/daishiman/UBM-Hyogo/issues/200
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | 小規模 |
| ステータス | 未実施 |

---

## 概要
TTL 10 分超過で stuck したロックの状態確認 SQL、安全な解除手順、再実行手順を runbook 化。`bash scripts/cf.sh d1 execute` 経由（wrangler 直叩き禁止）。

## 仕様書
`docs/30-workflows/unassigned-task/03b-followup-007-lock-ttl-recovery-runbook.md`

## 引き取り候補
infrastructure runbook（doc/15-infrastructure-runbook 改訂もしくは 09b cron triggers monitoring 系）

## 発見元
03b Phase 12 / `outputs/phase-12/unassigned-task-detection.md` 検出 #10
