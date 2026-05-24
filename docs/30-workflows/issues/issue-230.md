# [#230] [skill-ledger T-6 U-6] lefthook.yml 直編集禁止の grep / pre-commit ガード

## メタ情報

```yaml
issue_number: 230
title: [skill-ledger T-6 U-6] lefthook.yml 直編集禁止の grep / pre-commit ガード
state: OPEN
priority: 低
scale: 小規模
category: 改善
status: 未実施
created_date: 2026-04-29
updated_date: 2026-04-29
url: https://github.com/daishiman/UBM-Hyogo/issues/230
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 低 |
| 規模 | 小規模 |
| ステータス | 未実施 |

---

## 概要

`.git/hooks/*` 手書き禁止に加え、`lefthook.yml` 自体への偶発直編集を機械的に検知する仕組み。任意項目だが governance 強化に資する。

## 仕様書

- docs/30-workflows/unassigned-task/task-skill-ledger-t6-lefthook-edit-guard.md

## 起点

- docs/30-workflows/skill-ledger-t6-hook-idempotency/outputs/phase-12/unassigned-task-detection.md (U-6)

## 受入条件

- AC-1: `.git/hooks/` 配下の手書き追加で CI fail
- AC-2: `lefthook.yml` 変更時にレビュー必須化 or 確認プロンプト
- AC-3: 拒否時メッセージから CLAUDE.md hook 方針へ辿れる
- AC-4: false positive 最小化（`lefthook install` 自動配置除外）
