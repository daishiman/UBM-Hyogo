# [#86] [UT-34] KV Namespace ID 混入防止 pre-commit guard

## メタ情報

```yaml
issue_number: 86
title: [UT-34] KV Namespace ID 混入防止 pre-commit guard
state: OPEN
priority: 低
scale: -
category: 要件
status: -
created_date: 2026-04-27
updated_date: 2026-04-27
url: https://github.com/daishiman/UBM-Hyogo/issues/86
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 低 |
| 規模 | - |
| ステータス | - |

---

## 概要

Cloudflare KV Namespace ID（32 桁 hex）などの実 ID がドキュメント・コードに混入する前に検出する仕組みを整備する。1Password 管理の実 ID が誤ってリポジトリにコミットされる事故を防止する。

## 実装内容

- 32 桁 hex パターン検出スクリプト
- false positive 除外リストの定義
- pre-commit hook または CI チェックとしての組み込み評価
- gitleaks カスタムルールの検討

## 依存タスク

- 関連: UT-35 KV Namespace 実 ID 発行
- 関連: UT-05 CI/CD パイプライン実装

## 参照ドキュメント

- `docs/30-workflows/ut-13-cloudflare-kv-session-cache/outputs/phase-06/failure-cases.md`（FC-05: 実 ID 漏洩）

## タスク仕様書

`docs/30-workflows/unassigned-task/UT-34-kv-secret-leak-precommit-guard.md`
