# [#207] [UT-GOV-002-EVAL] OIDC 化と workflow_run 採用評価（spike）

## メタ情報

```yaml
issue_number: 207
title: [UT-GOV-002-EVAL] OIDC 化と workflow_run 採用評価（spike）
state: OPEN
priority: 中
scale: 小規模
category: セキュリティ
status: 未実施
created_date: 2026-04-28
updated_date: 2026-04-28
url: https://github.com/daishiman/UBM-Hyogo/issues/207
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | 小規模 |
| ステータス | 未実施 |

---

## 概要

Cloudflare デプロイの OIDC 化と `workflow_run` トリガ採用の評価を行う spike タスク。コスト / 攻撃面削減効果 / 実装負荷の Decision matrix を出力する。実装は scope 外。

仕様書: `docs/30-workflows/unassigned-task/UT-GOV-002-EVAL-oidc-and-workflow-run.md`
上流: `docs/30-workflows/ut-gov-002-pr-target-safety-gate-dry-run/` Decision Log
発見元: outputs/phase-12/unassigned-task-detection.md U-4

## スコープ

- OIDC 化の評価（Cloudflare 側 audience 検証要件含む）
- `workflow_run` トリガ採用の評価
- Decision matrix（コスト / 攻撃面削減効果 / 実装負荷）の出力

含まない: 実装 / migration

## 苦戦ポイント

- Cloudflare 側 audience 検証の追加要件
- OIDC 化が現状の secrets binding を上回る価値を提供するかは不確実

## 検証方法

- Decision matrix doc の作成
- `workflow_run` 採用時は U-4 を high に再分類する判断基準の明文化
