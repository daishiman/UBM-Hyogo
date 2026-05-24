# [#61] [UT-05-Followup-001] reusable workflow 化検討

## メタ情報

```yaml
issue_number: 61
title: [UT-05-Followup-001] reusable workflow 化検討
state: OPEN
priority: 低
scale: -
category: 改善
status: -
created_date: 2026-04-26
updated_date: 2026-04-26
url: https://github.com/daishiman/UBM-Hyogo/issues/61
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 低 |
| 規模 | - |
| ステータス | - |

---

## 概要

UT-05 CI/CD パイプラインの `ci-gate` / `lint-typecheck-test` 共通処理を reusable workflow (`_*.reusable.yml`) として切り出し、UT-X / 別リポでも再利用できるようにするか検討する。

## 仕様書

`docs/30-workflows/unassigned-task/ut-05-followup-001-reusable-workflows.md`

## 由来

UT-05 Phase 8 §5.2 / Phase 10 MINOR-A・MINOR-B

## 依存

- UT-05 CI/CD pipeline 実装完了
- 04-serial-cicd-secrets-and-environment-sync 実装完了
