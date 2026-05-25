# [#62] [UT-05-Followup-002] CI matrix 拡張（多 OS / 多 Node）

## メタ情報

```yaml
issue_number: 62
title: [UT-05-Followup-002] CI matrix 拡張（多 OS / 多 Node）
state: OPEN
priority: 低
scale: -
category: 改善
status: -
created_date: 2026-04-26
updated_date: 2026-04-26
url: https://github.com/daishiman/UBM-Hyogo/issues/62
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 低 |
| 規模 | - |
| ステータス | - |

---

## 概要

unit-test / build-smoke の matrix を `ubuntu-latest` 単一 → ubuntu / macOS、Node 20 / 24 へ拡張する判断。コスト影響評価が前提。

## 仕様書

`docs/30-workflows/unassigned-task/ut-05-followup-002-matrix-extension.md`

## 由来

UT-05 Phase 10 MINOR-I

## 依存

- Actions minutes コスト影響評価
