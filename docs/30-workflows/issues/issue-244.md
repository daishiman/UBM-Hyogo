# [#244] [UT-25-DERIV-03] Cloudflare Secret 監査ログ運用

## メタ情報

```yaml
issue_number: 244
title: [UT-25-DERIV-03] Cloudflare Secret 監査ログ運用
state: OPEN
priority: 中
scale: -
category: 改善
status: -
created_date: 2026-04-29
updated_date: 2026-04-29
url: https://github.com/daishiman/UBM-Hyogo/issues/244
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | - |
| ステータス | - |

---

## 概要

Cloudflare Workers Secret の参照・更新 audit log を Cloudflare API で取得し、
誰がいつ secret を put/delete したかの記録を残す経路を整備する。
本タスクの Phase 11 では smoke 実走者の手動ログのみで、システマティックな audit ではない。

## 検出元

- 親タスク: UT-25 Cloudflare Secrets 本番配置（#40）
- Phase 11 §保証できない範囲
- Phase 12 unassigned-task-detection

## 仕様書

- `docs/30-workflows/unassigned-task/UT-25-DERIV-03-cf-secrets-audit-log.md`

## 親タスクの実装ガイド

- `docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/outputs/phase-12/implementation-guide.md`

## 着手前提

UT-25 Phase 13 完了。

## 優先度

MEDIUM（監査要件の充足、運用安定化フェーズ）。
