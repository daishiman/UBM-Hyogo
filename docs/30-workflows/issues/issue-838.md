# [#838] serial-05-step-03 followup-007: schema alias rollback 発生時の通知

## メタ情報

```yaml
issue_number: 838
title: serial-05-step-03 followup-007: schema alias rollback 発生時の通知
state: OPEN
priority: 低
scale: 中規模
category: followup
status: -
created_date: 2026-05-19
updated_date: 2026-05-19
url: https://github.com/daishiman/UBM-Hyogo/issues/838
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 低 |
| 規模 | 中規模 |
| ステータス | - |

---

## 概要

Issue #778 で実装した schema alias rollback の運用通知を追加する。

rollback は監査上重要な操作だが、通知チャネル（Slack / email / dashboard alert）と通知条件は未確定。Issue #778 本体に含めると rollback / undo の基本経路完成を妨げるため、通知は独立 follow-up とする。

## 仕様書

`docs/30-workflows/unassigned-task/serial-05-step-03-followup-007-schema-alias-rollback-notification.md`

## スコープ

### 含む
- 通知チャネルの選定
- 通知 payload の secret / PII redaction
- rollback audit log との連携
- retry / failure handling

### 含まない
- rollback / undo 本体（Issue #778）
- 集計再実行（followup-005）
- bulk rollback（followup-006）

## 受入条件

- 通知 payload に secret / PII が含まれない
- notification failure が rollback transaction を壊さない
- runtime smoke evidence が tracked file として残る

## 発見元

`docs/30-workflows/issue-778-schema-alias-rollback-undo/` Phase 12
