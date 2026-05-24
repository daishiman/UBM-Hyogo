# [#165] [task-claude-code-cc-alias-guard-ci-001] cc alias guard の CI/pre-commit 化

## メタ情報

```yaml
issue_number: 165
title: [task-claude-code-cc-alias-guard-ci-001] cc alias guard の CI/pre-commit 化
state: OPEN
priority: 中
scale: -
category: -
status: 未実施
created_date: 2026-04-28
updated_date: 2026-04-28
url: https://github.com/daishiman/UBM-Hyogo/issues/165
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | - |
| ステータス | 未実施 |

---

## 概要

`cc` alias 重複検出 guard（TC-R-01）を pre-commit hook + CI（GitHub Actions zsh job）に組み込み、再発を自動検知する。

## 仕様書

`docs/30-workflows/unassigned-task/task-claude-code-cc-alias-guard-ci-001.md`

## 発見元

`task-claude-code-permissions-apply-001` Phase 12 unassigned-task-detection（N1）
