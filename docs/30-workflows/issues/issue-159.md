# [#159] [UT-B1-A2-REVIEW] A-2 完了レビュー時の B-1 attribute 残存確認

## メタ情報

```yaml
issue_number: 159
title: [UT-B1-A2-REVIEW] A-2 完了レビュー時の B-1 attribute 残存確認
state: OPEN
priority: 低
scale: 小規模
category: 改善
status: 未実施
created_date: 2026-04-28
updated_date: 2026-04-28
url: https://github.com/daishiman/UBM-Hyogo/issues/159
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 低 |
| 規模 | 小規模 |
| ステータス | 未実施 |

---

## 概要

B-1 は A-2 fragment 化完了までの保険施策。A-2 完了レビューに「B-1 attribute 残存確認」「解除可否判定」のチェック項目を追加し、保険施策が恒久設定にならないようにする。

仕様書: `docs/30-workflows/unassigned-task/task-skill-ledger-b1-a2-completion-review.md`
親タスク: skill-ledger-b1-gitattributes
発見元: outputs/phase-12/unassigned-task-detection.md（2026-04-28）

## 受入条件（要旨）

- A-2 完了レビュー文書に B-1 残存確認欄が追加されている
- `_legacy.md` 残存一覧と分類（空 / 移行済み / 追記継続中）
- B-1 セクションの削除 / 継続 / 保留が evidence 付きで判断
- 削除判定の場合は B-1 解除差分または follow-up 未タスクを作成
- 継続判定の場合は次回レビュー条件を記録

## 依存・連携

- task-skill-ledger-a2-fragment（A-2 完了が前提）
- UT-B1-IMPL（B-1 実装済みの場合）

詳細・苦戦箇所は仕様書参照。
