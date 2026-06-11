# Phase 11 UI サニティ / 視覚レビュー

## メタ情報
- TASK_ID: `TASK-MEMBER-FORM-DATA-REFLECTION-001`
- task 分類: **VISUAL**
- 状態: `pending_implementation`（spec_created。capture は user-gated）

## VISUAL 宣言

本タスクは VISUAL だが、**apps/web 表現層のコードは変更しない**（健全 = 無罪）。表示が空→反映に変わるのは Lane A/B/C によるデータ復旧の結果であり、UI コンポーネントの視覚変更ではない。

## 視覚レビュー観点（実機実行時）

| 観点 | 確認内容 |
|------|---------|
| レイアウト | プロトタイプ準拠 5 セクション（Hero / BUSINESS / TAGS / PERSONAL / MESSAGE）が崩れない |
| データ反映 | 全項目 "—" → 会員実入力値。空項目のみ "—" を維持 |
| 回帰 | 既に正常表示されている他メンバーが退行しない |

## screenshot 計画

- `member-detail-before-recovery.png`（復旧前・空表示）
- `member-detail-after-recovery.png`（復旧後・項目反映）
- canonical 名は screenshot-plan.json / phase11-capture-metadata.json / phase-11.md / Phase 12 implementation-guide の 4 か所で一致させる。
- capture: pending（user-gated）
