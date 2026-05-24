# [#197] [03b-followup-004] 旧 ruleConsent / 単数形 consent キーを禁止する lint rule

## メタ情報

```yaml
issue_number: 197
title: [03b-followup-004] 旧 ruleConsent / 単数形 consent キーを禁止する lint rule
state: OPEN
priority: 低
scale: 小規模
category: 改善
status: 未実施
created_date: 2026-04-28
updated_date: 2026-04-28
url: https://github.com/daishiman/UBM-Hyogo/issues/197
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 低 |
| 規模 | 小規模 |
| ステータス | 未実施 |

---

## 概要
不変条件 #2「consent キーは publicConsent と rulesConsent に統一」を grep ベースから機械的検出に格上げ。`scripts/lint-boundaries.mjs` 拡張または ESLint custom rule で実装。

## 仕様書
`docs/30-workflows/unassigned-task/03b-followup-004-ruleconsent-lint-rule.md`

## 引き取り候補
linting / CI 共通 task

## 発見元
03b Phase 12 / `outputs/phase-12/unassigned-task-detection.md` 検出 #6
