# [#203] [task-task-specification-governance-template-hardening] task-specification-creator テンプレ強化

## メタ情報

```yaml
issue_number: 203
title: [task-task-specification-governance-template-hardening] task-specification-creator テンプレ強化
state: OPEN
priority: 中
scale: 中規模
category: 改善
status: 未実施
created_date: 2026-04-28
updated_date: 2026-04-28
url: https://github.com/daishiman/UBM-Hyogo/issues/203
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | 中規模 |
| ステータス | 未実施 |

---

## 概要

UT-GOV-001 で有効に働いた governance / 外部 API 適用パターン（Phase 13 二重承認、Phase 11 NOT EXECUTED evidence、GET snapshot と PUT payload 用途分離、UT-GOV-004 完了前提の N 重明記、secret wording grep guard）を、`task-specification-creator` のテンプレ・validator・patterns に汎化反映するタスク。

## 背景

- 派生元: `docs/30-workflows/ut-gov-001-github-branch-protection-apply/outputs/phase-12/skill-feedback-report.md`
- UT-GOV-001 で得た知見をスキル正本に取り込まないと、次の governance / 外部 API 適用タスクで同じ仕様検討を繰り返す

## 受入条件

- [ ] Phase 13 `user_approval_required: true` と Phase 11 NOT EXECUTED の双方向テンプレ注釈を追加
- [ ] GET / PUT 用途分離 boundary の Phase 11 evidence 例を追加
- [ ] 外部 API adapter（GET 形 → PUT 形）テンプレ化
- [ ] 順序事故防止の N 重明記パターン化
- [ ] Part 1 専門用語セルフチェック例に branch protection / snapshot / payload を追加
- [ ] secret wording grep guard の validator 汎化検討
- [ ] UT-GOV-001 既存成果物が新テンプレ / validator でも PASS する

## 含まないもの

- UT-GOV-001 の branch protection 実適用
- 既存 workflow の一括書き換え
- commit / PR / push の自動実行

## リスクと対策

- validator 強化で既存 docs-only workflow が大量警告化 → warning → error の段階移行
- テンプレ肥大化 → patterns / references へ分割し SKILL.md には導線だけ
- governance 固有ルールの過剰一般化 → 外部 API / destructive operation / user approval required の条件付きパターンに限定

## 仕様書

`docs/30-workflows/unassigned-task/task-task-specification-governance-template-hardening.md`
