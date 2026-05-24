# [#186] [TASK-SKILL-VALID-FIXTURE-EXAMPLE-LINK-001] valid-skill fixture の reference link 修復

## メタ情報

```yaml
issue_number: 186
title: [TASK-SKILL-VALID-FIXTURE-EXAMPLE-LINK-001] valid-skill fixture の reference link 修復
state: OPEN
priority: 中
scale: 小規模
category: バグ修正
status: 未実施
created_date: 2026-04-28
updated_date: 2026-04-28
url: https://github.com/daishiman/UBM-Hyogo/issues/186
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | 小規模 |
| ステータス | 未実施 |

---

## 概要

`valid-skill` fixture の `references/example.md` が `SKILL.md.fixture` からリンクされておらず、`quick_validate.test.js` の TC-N-004/014/WC-* が失敗している。

## 仕様書

`docs/30-workflows/unassigned-task/TASK-SKILL-VALID-FIXTURE-EXAMPLE-LINK-001.md`

## 発見元

`skill-md-codex-validation-fix` Phase 12 close-out

## 完了条件

- valid-skill fixture が reference link 検証を通る
- 意図的不正 fixture の失敗期待が変わっていない

## 苦戦予想ポイント

- 「意図的不正」 vs 「意図しない不正」 fixture の切り分け（メタコメント付与）
- skill-creator 仕様での reference link 検証基準の明確化
