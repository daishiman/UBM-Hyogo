# [#64] [UT-05-Followup-004] Environment Secret 上書き監査

## メタ情報

```yaml
issue_number: 64
title: [UT-05-Followup-004] Environment Secret 上書き監査
state: OPEN
priority: 低
scale: -
category: 改善
status: -
created_date: 2026-04-26
updated_date: 2026-04-26
url: https://github.com/daishiman/UBM-Hyogo/issues/64
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 低 |
| 規模 | - |
| ステータス | - |

---

## 概要

GitHub Environment Secrets の staging / production が同一値で運用されていないかを定期監査するスクリプト。

## 仕様書

`docs/30-workflows/unassigned-task/ut-05-followup-004-env-secret-audit.md`

## 由来

UT-05 Phase 6 A-18 / Phase 7 §8

## 依存

- secrets rotation runbook
