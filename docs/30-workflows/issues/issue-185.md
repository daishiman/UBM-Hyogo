# [#185] [TASK-SKILL-TASKSPEC-CREATOR-LINE-LIMIT-001] task-specification-creator/SKILL.md 500行制限超過の解消

## メタ情報

```yaml
issue_number: 185
title: [TASK-SKILL-TASKSPEC-CREATOR-LINE-LIMIT-001] task-specification-creator/SKILL.md 500行制限超過の解消
state: OPEN
priority: 中
scale: 中規模
category: 改善
status: 未実施
created_date: 2026-04-28
updated_date: 2026-04-28
url: https://github.com/daishiman/UBM-Hyogo/issues/185
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | 中規模 |
| ステータス | 未実施 |

---

## 概要

`task-specification-creator/SKILL.md` が 517 行で 500 行制限を超過しており、`quick_validate.test.js` の line-limit テストが失敗し続けている。

## 仕様書

`docs/30-workflows/unassigned-task/TASK-SKILL-TASKSPEC-CREATOR-LINE-LIMIT-001.md`

## 発見元

`skill-md-codex-validation-fix` Phase 12 close-out

## 完了条件

- SKILL.md が 500 行以内
- quick_validate の line-limit エラー 0
- 移動先リンク切れなし

## 苦戦予想ポイント

- references/ 移送時のアンカー再リンク
- 他 fixture 系 quick_validate 失敗との切り分け
- skill-creator テンプレ側に 500 行 assertion を将来的に追加すべき
