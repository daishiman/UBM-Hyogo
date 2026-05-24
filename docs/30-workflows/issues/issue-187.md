# [#187] [TASK-DOC-SPEC-UPDATE-WORKFLOW-WARN3-001] spec-update-workflow.md に Warning 3 段階分類を追記

## メタ情報

```yaml
issue_number: 187
title: [TASK-DOC-SPEC-UPDATE-WORKFLOW-WARN3-001] spec-update-workflow.md に Warning 3 段階分類を追記
state: OPEN
priority: 低
scale: 小規模
category: 改善
status: 未実施
created_date: 2026-04-28
updated_date: 2026-04-28
url: https://github.com/daishiman/UBM-Hyogo/issues/187
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 低 |
| 規模 | 小規模 |
| ステータス | 未実施 |

---

## 概要

`quick_validate.test.js` TC-RG-006/007 が `spec-update-workflow.md` の Warning 3 段階分類セクション欠落により失敗している。Phase 12 の警告判定の正本化が必要。

## 仕様書

`docs/30-workflows/unassigned-task/TASK-DOC-SPEC-UPDATE-WORKFLOW-WARN3-001.md`

## 発見元

`skill-md-codex-validation-fix` Phase 12 close-out

## 完了条件

- Warning 3 段階分類が正本ドキュメントから参照可能
- quick_validate の該当テストが通る
- Phase 12 成果物で warning と unassigned の境界が説明可能

## 苦戦予想ポイント

- Warning 表現が複数ドキュメントに散在（正本 1 箇所原則の徹底）
- quick_validate test description 側にも対象ファイル限定の理由コメント追加
- severity 定義に「未タスク昇格条件」一文を併記
